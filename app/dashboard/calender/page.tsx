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
        .custom-orange-calendar .rbc-toolbar button {
          background-color: #f97316;
          color: white;
          margin: 10px;
          border-radius: 12px !important;
          padding: 4px 10px;
          transition: background-color 0.2s ease;
        }
        .custom-orange-calendar .rbc-toolbar button:hover {
          background-color: #ea580c;
        }
        .custom-orange-calendar .rbc-today {
  background-color: rgba(249, 115, 22, 0.1) !important; /* light orange */
}
.custom-orange-calendar .rbc-month-view,
.custom-orange-calendar .rbc-time-view,
.custom-orange-calendar .rbc-day-bg {
  background-color: #ffffff !important; /* rest all white */
}
  .custom-orange-calendar .rbc-month-view,
.custom-orange-calendar .rbc-time-view,
.custom-orange-calendar .rbc-day-bg {
  background-color: #ffffff !important;
}

/* Override only today's cell */
.custom-orange-calendar .rbc-day-bg.rbc-today {
  background-color: rgba(249, 115, 22, 0.1) !important; /* light orange */
}
        .custom-orange-calendar .rbc-month-view,
        .custom-orange-calendar .rbc-time-view,
        .custom-orange-calendar .rbc-day-bg {
          background-color: #ffffff !important;
        }
        .custom-orange-calendar .rbc-event {
          background-color: #f97316;
          border-radius: 6px;
          padding: 2px 6px;
        }
        .custom-orange-calendar .rbc-event:hover {
          transform: scale(1.03);
        }
      `}</style>
    </div>
  );
}
