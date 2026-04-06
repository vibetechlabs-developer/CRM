import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Calendar as CalendarIcon, CheckCircle2, Circle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

type Priority = "HIGH" | "MEDIUM" | "LOW";

interface AgentNote {
  id: number;
  date: string;
  content: string;
  priority: Priority;
  is_completed: boolean;
}

export default function DailyPlanner() {
  const [date, setDate] = useState<Date>(new Date());
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const formattedDate = format(date, "yyyy-MM-dd");

  const { data: notes = [], isLoading } = useQuery<AgentNote[]>({
    queryKey: ["agent-notes", formattedDate],
    queryFn: async () => {
      const res = await api.get(`/api/users/notes/?date=${formattedDate}`);
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
  });

  const createNote = useMutation({
    mutationFn: async (newNote: { date: string; content: string; priority: Priority }) => {
      const res = await api.post("/api/users/notes/", newNote);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-notes", formattedDate] });
      setContent("");
      toast({ title: "Note added successfuly." });
    },
    onError: () => {
      toast({ title: "Failed to add note.", variant: "destructive" });
    }
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<AgentNote> & { id: number }) => {
      const res = await api.patch(`/api/users/notes/${id}/`, updateData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-notes", formattedDate] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/users/notes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-notes", formattedDate] });
      toast({ title: "Note deleted." });
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createNote.mutate({ date: formattedDate, content, priority });
  };

  const priorityColors = {
    HIGH: "text-red-500 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900",
    MEDIUM: "text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900",
    LOW: "text-green-500 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-900",
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      {/* Sidebar with Calendar */}
      <div className="w-full md:w-80 shrink-0 space-y-6">
        <div className="bg-card border rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4 font-medium text-lg px-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h3>Select Date</h3>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && setDate(newDate)}
            className="rounded-md border bg-background flex justify-center"
          />
        </div>
        
        <div className="bg-card border rounded-xl shadow-sm p-5 space-y-3">
          <h4 className="font-medium text-muted-foreground flex items-center gap-2">
            Priority Legend
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> High Priority</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Medium Priority</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Low Priority</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b shrink-0 bg-card/50">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Notes for {format(date, "MMMM d, yyyy")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage your daily tasks and priorities.</p>
        </div>

        <div className="p-6 border-b bg-muted/20 shrink-0">
          <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-3">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 bg-background"
            />
            <Select value={priority} onValueChange={(val: Priority) => setPriority(val)}>
              <SelectTrigger className="w-full sm:w-[140px] bg-background">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!content.trim() || createNote.isPending} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-lg font-medium text-foreground">No tasks for today</p>
              <p className="text-sm mt-1 max-w-sm">Enjoy your day or add a new task to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className={`group flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    note.is_completed ? "bg-muted/30 border-muted opacity-70" : "bg-card"
                  }`}
                >
                  <button 
                    onClick={() => updateNote.mutate({ id: note.id, is_completed: !note.is_completed })}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {note.is_completed ? (
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-base ${note.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {note.content}
                    </p>
                    <div className="flex items-center mt-2">
                       <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColors[note.priority]}`}>
                         {note.priority}
                       </span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={() => deleteNote.mutate(note.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
