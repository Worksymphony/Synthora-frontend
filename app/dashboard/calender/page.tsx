/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { auth, db } from "@/firebase/config";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDoc,
  query,
  getDocs,
  where,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { onAuthStateChanged, User } from "firebase/auth";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface UserType {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  parentAdminId?: string;
  resumeCount?: number;
  recruiters?: UserType[];
  [key: string]: any;
}

export default function CalendarTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [userdata, setUserdata] = useState<UserType>();
  const [newEvent, setNewEvent] = useState({ title: "", start: "", end: "" });

  // For event details modal
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() } as UserType;
        setUserdata(userData);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchEvents = async () => {
    if (userdata?.companyId) {
      try {
        const q = query(
          collection(db, "events"),
          where("companyId", "==", userdata.companyId)
        );
        const snapshot = await getDocs(q);

        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          start: doc.data().start.toDate(),
          end: doc.data().end.toDate(),
        }));
        setEvents(fetched);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    } else {
      setEvents([]);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userdata]);

  // Add event
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) return;
    await addDoc(collection(db, "events"), {
      title: newEvent.title,
      companyId: userdata?.companyId,
      start: Timestamp.fromDate(new Date(newEvent.start)),
      end: Timestamp.fromDate(new Date(newEvent.end)),
    });
    toast.success("Event Added Successfully!");
    fetchEvents();
    setNewEvent({ title: "", start: "", end: "" });
    setOpen(false);
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
      toast.success("Event Deleted Successfully!");
      fetchEvents();
      setSelectedEvent(null); // close modal after deletion
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete the event.");
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-white to-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold  text-orange-600 flex items-center gap-2">
          📅 Hiring Calendar
        </h1>
        <Button
          onClick={() => setOpen(true)}
          className="bg-orange-500  h-12 hover:bg-orange-600 text-white shadow-md rounded-full px-5 py-2 transition-all duration-200"
        >
          + Add Event
        </Button>
      </div>

      {/* Calendar */}
      <div className="rounded-lg border  font-bold border-orange-200 overflow-hidden shadow-md">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          className="custom-orange-calendar"
          onSelectEvent={(event) => setSelectedEvent(event)}
        />
      </div>

      {/* Add Event Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white rounded-xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-orange-600  font-semibold">
              Add Event
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Event Title"
              className="border-orange-300  focus:border-orange-500 focus:ring-orange-500"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
            />
            <Input
              type="datetime-local"
              className="border-orange-300  focus:border-orange-500 focus:ring-orange-500"
              value={newEvent.start}
              onChange={(e) =>
                setNewEvent({ ...newEvent, start: e.target.value })
              }
            />
            <Input
              type="datetime-local"
              className="border-orange-300  focus:border-orange-500 focus:ring-orange-500"
              value={newEvent.end}
              onChange={(e) =>
                setNewEvent({ ...newEvent, end: e.target.value })
              }
            />
            <Button
              onClick={handleAddEvent}
              className="w-full bg-orange-500  hover:bg-orange-600 text-white shadow-md"
            >
              Save Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="bg-white rounded-xl shadow-xl p-6">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-orange-600  font-semibold">
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-2 font-inter">
                <p>
                  <strong>Start:</strong>{" "}
                  {format(new Date(selectedEvent.start), "PPpp")}
                </p>
                <p>
                  <strong>End:</strong>{" "}
                  {format(new Date(selectedEvent.end), "PPpp")}
                </p>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete Event
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Calendar Styles */}
      <style jsx global>{`
  /* --- Calendar Wrapper --- */
  .custom-orange-calendar {
    font-family: 'Inter', sans-serif;
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
  }

  /* --- Toolbar --- */
  .custom-orange-calendar .rbc-toolbar {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: none;
  }
  .custom-orange-calendar .rbc-toolbar button {
    padding: 0.5rem 1rem;
    font-weight: 500;
    border-radius: 8px;
    border: 1px solid #e5e7eb; /* gray-200 */
    background: #fff;
    color: #374151; /* gray-700 */
    transition: all 0.2s ease;
  }
  .custom-orange-calendar .rbc-toolbar button:hover {
    background: #fef3c7; /* amber-100 */
    color: #f97316; /* orange-500 */
  }
  .custom-orange-calendar .rbc-toolbar button.rbc-active {
    background: #f97316; /* orange-500 */
    color: #fff;
    border-color: #f97316;
  }

  /* --- Month View Grid --- */
  .custom-orange-calendar .rbc-month-view {
    border: none;
  }
  .custom-orange-calendar .rbc-month-row {
    border: none;
  }
  .custom-orange-calendar .rbc-date-cell {
    padding: 0.75rem;
    text-align: right;
    font-weight: 600;
    color: #374151;
  }
  .custom-orange-calendar .rbc-date-cell > a {
    font-size: 0.875rem;
    font-weight: 600;
    color: inherit;
  }
  .custom-orange-calendar .rbc-off-range {
    color: #d1d5db; /* gray-400 */
  }
  .custom-orange-calendar .rbc-day-bg {
    border: 1px solid #f3f4f6; /* gray-100 */
    border-radius: 12px;
    transition: background 0.2s ease;
  }
  .custom-orange-calendar .rbc-day-bg:hover {
    background: #fff7ed; /* orange-50 */
  }
  .custom-orange-calendar .rbc-today {
    background: #fff7ed !important; /* orange-50 */
    border: 2px solid #f97316 !important; /* orange-500 */
  }

  /* --- Events --- */
  .custom-orange-calendar .rbc-event {
    background: #f97316;
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 0.75rem;
    font-weight: 500;
    color: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  /* --- Header Row --- */
  .custom-orange-calendar .rbc-header {
    border: none;
    padding: 0.75rem 0;
    font-weight: 600;
    color: #6b7280; /* gray-500 */
    text-transform: uppercase;
    font-size: 0.75rem;
  }
`}</style>

    </div>
  );
}