
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp,
  setDoc,
  where
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { Ticket, Status, User, Priority, SystemType } from "../types";
import { notifyNewRequest, notifyStatusUpdate } from "./lineService";

const formatSystemDate = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d} ${hh}.${mm}`;
};

class FirebaseService {
  private get ticketsCollection() {
    if (!db) throw new Error("Firebase is not initialized. Please check your API key.");
    return collection(db, "tickets");
  }

  async getAllTickets(): Promise<Ticket[]> {
    try {
      if (!db) return [];
      
      const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), ms));
      
      const fetchData = async () => {
        const q = query(this.ticketsCollection, orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          ...doc.data(),
          // Ensure ticketId is the doc ID if not present in data
          ticketId: doc.data().ticketId || doc.id
        })) as Ticket[];
      };

      return Promise.race([fetchData(), timeout(15000)]) as Promise<Ticket[]>;
    } catch (error) {
      console.error("Error getting tickets: ", error);
      return [];
    }
  }

  async createTicket(ticket: Omit<Ticket, 'ticketId' | 'status' | 'startDate' | 'month' | 'technician' | 'fixDetail' | 'closeDate'>): Promise<Ticket> {
    if (!db) throw new Error("Firebase is not initialized. Please check your API key.");
    
    const prefix = ticket.systemType === 'IT' ? 'IT-' : 'MT-';
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ticketId = prefix + randomId;
    const now = new Date();
    
    let imageUrl = ticket.imageUrl;
    
    // Create a promise that rejects after a timeout
    const timeout = (ms: number, message: string) => new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

    const uploadAndSave = async () => {
      // ... upload image ...
      if (imageUrl && imageUrl.startsWith('data:image')) {
        if (storage) {
          try {
            const storageRef = ref(storage, `tickets/${ticketId}`);
            // Shorter timeout for storage (20s)
            await Promise.race([
              uploadString(storageRef, imageUrl, 'data_url'),
              timeout(20000, "Storage upload timeout")
            ]);
            imageUrl = await getDownloadURL(storageRef);
          } catch (error) {
            console.warn("Storage upload failed or timed out, falling back to Base64 storage in Firestore", error);
          }
        }
      }

      const newTicket: Ticket = {
        ...ticket,
        ticketId,
        imageUrl,
        status: Status.NEW,
        startDate: formatSystemDate(now),
        month: (now.getMonth() + 1).toString(),
        technician: '',
        fixDetail: '',
        closeDate: ''
      };

      try {
        // Use setDoc with ticketId as the document ID
        // We race this against a timeout to detect missing database
        await Promise.race([
          setDoc(doc(db, "tickets", ticketId), newTicket),
          timeout(15000, "Firestore connection timeout / ไม่สามารถเชื่อมต่อฐานข้อมูลได้")
        ]);
      } catch (err: any) {
        console.error("Firestore error:", err);
        if (err.message?.includes("timeout")) {
          throw new Error("Request timeout / การเชื่อมต่อล่าช้าเกินไป\n\nสาเหตุที่เป็นไปได้:\n1. ยังไม่ได้กด 'Create Database' ใน Firebase Console (เมนู Firestore Database)\n2. ยังไม่ได้ตั้งค่า Rules เป็น 'allow read, write: if true;'\n3. อินเทอร์เน็ตขัดข้อง");
        }
        throw err;
      }
      
      try {
        notifyNewRequest(newTicket);
      } catch (e) {
        console.error("LINE notification failed but ticket was saved", e);
      }
      
      return newTicket;
    };

    return uploadAndSave();
  }

  async updateTicket(ticketId: string, updates: Partial<Ticket>, currentUser: User): Promise<void> {
    if (!db) throw new Error("Firebase is not initialized. Please check your API key.");
    
    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), ms));

    const performUpdate = async () => {
      const ticketRef = doc(db, "tickets", ticketId);
      const finalUpdates: any = { ...updates };
      
      if (updates.status === Status.CLOSED) {
        finalUpdates.closeDate = formatSystemDate(new Date());
      }
      
      await updateDoc(ticketRef, finalUpdates);

      try {
        notifyStatusUpdate({ ticketId, ...updates } as Ticket);
      } catch (e) {
        console.error("LINE notification failed but ticket was updated", e);
      }
    };

    return Promise.race([performUpdate(), timeout(15000)]) as Promise<void>;
  }

  async deleteTicket(ticketId: string): Promise<void> {
    if (!db) throw new Error("Firebase is not initialized");
    
    console.log(`[FirebaseService] Attempting to delete ticket: ${ticketId}`);
    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), ms));

    const performDelete = async () => {
      // 1. Try to delete by ID directly (for new tickets)
      const docRef = doc(db, "tickets", ticketId);
      
      // 2. Also try to find by ticketId field (for older tickets)
      const q = query(collection(db, "tickets"), where("ticketId", "==", ticketId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Delete all matching documents (usually just one)
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        console.log(`[FirebaseService] Deleted ${querySnapshot.size} documents matching ticketId: ${ticketId}`);
      } else {
        // Fallback to direct ID delete if query found nothing
        await deleteDoc(docRef);
        console.log(`[FirebaseService] Direct ID delete attempted for: ${ticketId}`);
      }
    };

    try {
      await Promise.race([performDelete(), timeout(15000)]);
    } catch (error: any) {
      console.error("Error deleting ticket: ", error);
      throw new Error(`ลบข้อมูลไม่สำเร็จ: ${error.message || 'Unknown error'}`);
    }
  }
}

export const firebaseService = new FirebaseService();
