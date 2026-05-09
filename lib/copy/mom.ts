export const MOM = {
  callerId: "Mom 📞",
  callSubtitle: "incoming whatsapp video call",
  answerLabel: "Answer",
  declineLabel: "Decline",
  answerDismiss: "Mom called Papa instead.",
  declineTiers: [
    "Mom is trying to reach you. (Attempt 1)",
    "Mom is trying to reach you. (She has a forwarded video)",
    "Mom has sent a voice note.",
    "Mom: 'Are you eating?'",
    "Mummy updated status to 😔. Bua aunty has commented 🙏 strength.",
  ] as const,
  intervalMs: 4 * 60 * 1000,  // every 4 minutes
};
