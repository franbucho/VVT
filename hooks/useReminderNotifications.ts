import { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { Reminder } from '../types';
import { getReminders, updateReminderLastTriggered } from '../services/firestoreService';

// Helper to calculate next trigger time with more precision for months
const calculateNextTrigger = (reminder: Reminder): number => {
    const baseDate = reminder.lastTriggeredAt ? reminder.lastTriggeredAt.toDate() : reminder.startsAt.toDate();
    const nextDate = new Date(baseDate.getTime());

    switch (reminder.frequency) {
        case 'hours':
            nextDate.setHours(nextDate.getHours() + reminder.interval);
            break;
        case 'days':
            nextDate.setDate(nextDate.getDate() + reminder.interval);
            break;
        case 'weeks':
            nextDate.setDate(nextDate.getDate() + reminder.interval * 7);
            break;
        case 'months':
            nextDate.setMonth(nextDate.getMonth() + reminder.interval);
            break;
    }
    return nextDate.getTime();
};

export const useReminderNotifications = (currentUser: firebase.User | null) => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const intervalRef = useRef<number | null>(null);

    // Fetch reminders when user logs in or when reminders change from another tab (not implemented, but good practice)
    useEffect(() => {
        if (currentUser) {
            getReminders(currentUser.uid).then(setReminders).catch(console.error);
        } else {
            setReminders([]);
        }
    }, [currentUser]);

    // Setup the checking interval
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        if (reminders.length > 0 && currentUser) {
            intervalRef.current = window.setInterval(() => {
                const now = new Date().getTime();
                reminders.forEach(reminder => {
                    // Ensure the reminder's start time has passed
                    if (now < reminder.startsAt.toDate().getTime()) {
                        return;
                    }
                    
                    const nextDueTime = calculateNextTrigger(reminder);

                    if (now >= nextDueTime) {
                        if (Notification.permission === 'granted') {
                            const title = reminder.type === 'medication' 
                                ? 'Medication Reminder' 
                                : 'Consultation Reminder';
                            const body = `${reminder.name}: ${reminder.details}`;
                            new Notification(title, { body });

                            // Update in Firestore to prevent re-triggering
                            const newTriggerTime = firebase.firestore.Timestamp.now();
                            updateReminderLastTriggered(currentUser.uid, reminder.id, newTriggerTime)
                                .then(() => {
                                     // Update local state immediately for accuracy until next fetch
                                    setReminders(prev => prev.map(r => 
                                        r.id === reminder.id ? { ...r, lastTriggeredAt: newTriggerTime } : r
                                    ));
                                })
                                .catch(console.error);
                        }
                    }
                });
            }, 30 * 1000); // Check every 30 seconds for better timeliness
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [reminders, currentUser]);
};
