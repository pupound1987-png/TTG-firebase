
import { Department, RequestType, Status, Priority } from './types';

export const DEPARTMENTS: Department[] = [
  'Packing', 'Purchasing', 'Accounting', 'Marketing', 'Maintenance',
  'Import/Export', 'HR', 'Safety', 'Filingsoldering', 'Stone setting',
  'Executive secretary', 'QA-QC', 'Wax', 'Waxsetting', 'Store inventory','IT'
];

export const IT_REQUEST_TYPES: RequestType[] = ['Software', 'Hardware', 'Network', 'Printer', 'Other'];
export const MT_REQUEST_TYPES: RequestType[] = ['Electrical', 'Plumbing', 'Aircon', 'Building', 'Furniture', 'Utility', 'Other'];

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  Software: 'Software / ซอฟต์แวร์',
  Hardware: 'Hardware / ฮาร์ดแวร์',
  Network: 'Network / เครือข่าย',
  Printer: 'Printer / เครื่องพิมพ์',
  Electrical: 'Electrical / ไฟฟ้า',
  Plumbing: 'Plumbing / ประปา',
  Aircon: 'Aircon / แอร์',
  Building: 'Building / อาคาร',
  Furniture: 'Furniture / เฟอร์นิเจอร์',
  Utility: 'Utility / สาธารณูปโภค',
  Other: 'Other / อื่นๆ'
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const SYSTEM_COLORS = {
  IT: {
    primary: 'blue-600',
    glow: 'rgba(37, 99, 235, 0.4)',
    text: 'text-blue-700',
    border: 'border-blue-500/30'
  },
  MAINTENANCE: {
    primary: 'amber-600',
    glow: 'rgba(217, 119, 6, 0.4)',
    text: 'text-amber-700',
    border: 'border-amber-500/30'
  }
};

export const PRIORITIES: Record<Priority, { label: string; subLabel: string; color: string; bgColor: string }> = {
  'Low': { 
    label: 'Low / ต่ำ', 
    subLabel: 'Non-urgent / ไม่ด่วน', 
    color: 'text-slate-400', 
    bgColor: 'bg-slate-500/10' 
  },
  'Medium': { 
    label: 'Medium / กลาง', 
    subLabel: 'Today / ด่วนภายในวันนี้', 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10' 
  },
  'High': { 
    label: 'High / สูง', 
    subLabel: 'Immediate / ด่วนมากเดี๋ยวนี้', 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/10' 
  },
};

export const STATUS_LABELS: Record<Status, { label: string; icon: string; color: string }> = {
  [Status.NEW]: { label: 'NEW / แจ้งใหม่', icon: '🆕', color: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' },
  [Status.IN_PROGRESS]: { label: 'IN PROGRESS / กำลังทำ', icon: '👨‍🔧', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' },
  [Status.WAITING_CONFIRMATION]: { label: 'WAITING / รอการยืนยัน', icon: '⏳', color: 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30' },
  [Status.CLOSED]: { label: 'CLOSED / เสร็จสิ้น', icon: '✅', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' },
};

export const LINE_CONFIG = {
  // ใส่ Token ของคุณที่นี่ หรือตั้งค่าใน Environment Variable ชื่อ VITE_LINE_CHANNEL_ACCESS_TOKEN
  CHANNEL_ACCESS_TOKEN: import.meta.env.VITE_LINE_CHANNEL_ACCESS_TOKEN || 'rRlg8lDnZ8B7fB7Xl4xaYP8tdLkt29hMVu658qAG8gSpc/Gw/xJjwObfHZjGkHas1UJcAIqX4EQXkjRSAu4m8uogaVIz4iMAEE70i9n7/etsF5wLMSJoRyOvG7C3ciwF2Nq71OZarR00sARpZekx4wdB04t89/1O/w1cDnyilFU=',
  
  // ใส่ Group ID หรือ User ID ของคุณที่นี่ หรือตั้งค่าใน Environment Variable ชื่อ VITE_LINE_USER_ID
  USER_ID: import.meta.env.VITE_LINE_USER_ID || 'C20f63627a5e5f861c69d51c09278512f'
};
