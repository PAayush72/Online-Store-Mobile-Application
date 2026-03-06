// In your NotificationContext.js
const addNotification = async (newNotification) => {
  try {
    // Check for existing similar notifications
    const existingNotifications = notifications.filter(notification => 
      notification.type === newNotification.type &&
      notification.productId === newNotification.productId &&
      notification.title === newNotification.title &&
      notification.message === newNotification.message &&
      // Only check notifications from the last hour
      (new Date().getTime() - notification.createdAt) < 3600000 // 1 hour in milliseconds
    );

    // If a similar notification exists, don't add the new one
    if (existingNotifications.length > 0) {
      console.log('Similar notification already exists, skipping...');
      return;
    }

    // Add the new notification
    // Your existing notification adding logic here
  } catch (error) {
    console.error('Error adding notification:', error);
  }
};