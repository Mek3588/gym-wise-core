import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useNotifications() {
  const { toast } = useToast();

  const createPaymentDueNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get payments due in the next 3 days
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const { data: duePayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])
        .not('due_date', 'is', null);

      if (paymentsError) throw paymentsError;

      // Get overdue payments
      const today = new Date().toISOString().split('T')[0];
      const { data: overduePayments, error: overdueError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .lt('due_date', today);

      if (overdueError) throw overdueError;

      // Create notifications for due payments
      for (const payment of duePayments || []) {
        const existingNotification = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', payment.user_id)
          .eq('type', 'in_app')
          .ilike('message', `%${payment.id}%`)
          .single();

        if (!existingNotification.data) {
          await supabase
            .from('notifications')
            .insert({
              user_id: payment.user_id,
              type: 'in_app',
              title: 'Payment Due Soon',
              message: `Your payment of $${payment.amount} is due on ${payment.due_date}. Please make sure to pay on time.`
            });
        }
      }

      // Create notifications for overdue payments
      for (const payment of overduePayments || []) {
        const existingNotification = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', payment.user_id)
          .eq('type', 'in_app')
          .ilike('message', `%${payment.id}%`)
          .single();

        if (!existingNotification.data) {
          await supabase
            .from('notifications')
            .insert({
              user_id: payment.user_id,
              type: 'in_app',
              title: 'Payment Overdue',
              message: `Your payment of $${payment.amount} was due on ${payment.due_date}. Please pay immediately to avoid service interruption.`
            });
        }
      }
    } catch (error) {
      console.error('Error creating payment notifications:', error);
    }
  };

  const createClassReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get classes happening tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      const { data: tomorrowClasses, error } = await supabase
        .from('class_bookings')
        .select(`
          *,
          classes (
            name,
            start_time,
            room_location
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('booking_date', `${tomorrowDate}T00:00:00.000Z`)
        .lt('booking_date', `${tomorrowDate}T23:59:59.999Z`);

      if (error) throw error;

      // Create class reminder notifications
      for (const booking of tomorrowClasses || []) {
        const existingNotification = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'in_app')
          .ilike('message', `%${booking.class_id}%`)
          .single();

        if (!existingNotification.data) {
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'in_app',
              title: 'Class Reminder',
              message: `Don't forget about your ${booking.classes.name} class tomorrow at ${booking.classes.start_time} in ${booking.classes.room_location || 'the main gym'}.`
            });
        }
      }
    } catch (error) {
      console.error('Error creating class reminders:', error);
    }
  };

  useEffect(() => {
    const checkNotifications = async () => {
      await createPaymentDueNotifications();
      await createClassReminders();
    };

    // Check notifications on mount
    checkNotifications();

    // Set up interval to check every hour
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    createPaymentDueNotifications,
    createClassReminders
  };
}