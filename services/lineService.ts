
import { Ticket, Status } from '../types';
import { LINE_CONFIG, PRIORITIES } from '../constants';

const sendLineNotification = async (message: string, flexMessage?: any) => {
  try {
    const response = await fetch('/api/line-notify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        flexMessage,
        token: LINE_CONFIG.CHANNEL_ACCESS_TOKEN,
        userId: LINE_CONFIG.USER_ID
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('LINE notification failed (Backend):', error);
    }
  } catch (error) {
    console.error('LINE notification failed (Network):', error);
  }
};

const createFlexMessage = (title: string, color: string, fields: { label: string, value: string }[], systemType: string, footer?: string) => {
  const isIT = systemType === 'IT';
  const bodyBgColor = isIT ? '#F0F7FF' : '#FFF9F0';
  
  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            color: "#ffffff",
            size: "md"
          }
        ],
        backgroundColor: color
      },
      body: {
        type: "box",
        layout: "vertical",
        backgroundColor: bodyBgColor,
        contents: fields.map(f => ({
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: f.label,
              size: "sm",
              color: "#8c8c8c",
              flex: 2
            },
            {
              type: "text",
              text: f.value,
              size: "sm",
              color: "#333333",
              flex: 4,
              wrap: true,
              weight: "bold"
            }
          ],
          margin: "md"
        }))
      },
      footer: footer ? {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: footer,
            size: "xs",
            color: "#666666",
            style: "italic",
            align: "center"
          }
        ]
      } : undefined
    }
  };
};

export const notifyNewRequest = (ticket: Ticket) => {
  const priorityInfo = PRIORITIES[ticket.priority || 'Low'];
  const title = `🆕 NEW ${ticket.systemType} REQUEST`;
  // IT = Blue (#0052CC), Maintenance = Orange (#FF8C00)
  const color = ticket.systemType === 'IT' ? '#0052CC' : '#FF8C00';
  
  const fields = [
    { label: "ID", value: ticket.ticketId },
    { label: "Requester", value: ticket.requesterName },
    { label: "Dept", value: ticket.department },
    { label: "Type", value: ticket.type },
    { label: "Priority", value: priorityInfo.label },
    { label: "Detail", value: ticket.detail }
  ];

  if (ticket.imageUrl) {
    fields.push({ label: "Image", value: "Attached / มีรูปแนบ" });
  }

  const appUrl = window.location.origin;
  const footer = `Open App: ${appUrl}`;

  const flex = createFlexMessage(title, color, fields, ticket.systemType, footer);
  sendLineNotification(`${title}\nID: ${ticket.ticketId}\nView: ${appUrl}`, flex);
};

export const notifyStatusUpdate = (ticket: Ticket) => {
  let title = '⚙️ JOB STATUS UPDATED';
  
  // Determine system type from property or ID prefix
  const systemType = ticket.systemType || (ticket.ticketId?.startsWith('IT-') ? 'IT' : 'MAINTENANCE');
  
  // IT = Blue (#0052CC), Maintenance = Orange (#FF8C00)
  let color = systemType === 'IT' ? '#0052CC' : '#FF8C00';
  let fields: { label: string, value: string }[] = [
    { label: "ID", value: ticket.ticketId },
    { label: "Technician", value: ticket.technician }
  ];
  let footer = '';

  if (ticket.status === Status.IN_PROGRESS) {
    fields.push({ label: "Status", value: "IN PROGRESS" });
  } else if (ticket.status === Status.WAITING_CONFIRMATION) {
    fields.push({ label: "Status", value: "WAITING FOR CONFIRMATION" });
    fields.push({ label: "Fix Detail", value: ticket.fixDetail });
    footer = "Please confirm and close the job.";
  } else if (ticket.status === Status.CLOSED) {
    title = "✅ JOB CLOSED";
    color = "#059669"; // Emerald
    fields = [
      { label: "ID", value: ticket.ticketId },
      { label: "Closed by", value: ticket.requesterName },
      { label: "Status", value: "CLOSED" },
      { label: "Fix Detail", value: ticket.fixDetail }
    ];
  }

  const flex = createFlexMessage(title, color, fields, systemType, footer);
  sendLineNotification(`${title}\nID: ${ticket.ticketId}`, flex);
};
