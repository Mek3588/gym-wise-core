import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Users, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Class {
  id: string;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_bookings: number;
  room_location: string;
  status: 'scheduled' | 'cancelled' | 'completed' | 'ongoing';
  trainer_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface WorkoutSchedule {
  id: string;
  user_id: string;
  workout_id: string;
  trainer_id: string;
  scheduled_date: string;
  scheduled_time: string;
  notes: string;
  completed: boolean;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  workouts?: {
    name: string;
    description: string;
  } | null;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: 'member' | 'trainer' | 'admin';
}

interface Workout {
  id: string;
  name: string;
  description: string;
}

export default function Schedules() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [workoutSchedules, setWorkoutSchedules] = useState<WorkoutSchedule[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutSchedule | null>(null);
  const [activeTab, setActiveTab] = useState<'classes' | 'workouts'>('classes');
  const { toast } = useToast();

  const [classForm, setClassForm] = useState({
    name: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    max_capacity: 20,
    room_location: '',
    trainer_id: ''
  });

const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const [workoutForm, setWorkoutForm] = useState({
    user_id: '',
    workout_id: '',
    trainer_id: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, workoutSchedulesRes, profilesRes, workoutsRes] = await Promise.all([
        supabase
          .from('classes')
          .select(`
            *,
            profiles:trainer_id(first_name, last_name)
          `)
          .order('date', { ascending: true }),
        supabase
          .from('workout_schedules')
          .select(`
            *,
            profiles:user_id(first_name, last_name),
            workouts(name, description)
          `)
          .order('scheduled_date', { ascending: true }),
        supabase
          .from('profiles')
          .select('id, first_name, last_name, role'),
        supabase
          .from('workouts')
          .select('id, name, description')
      ]);

      if (classesRes.error) throw classesRes.error;
      if (workoutSchedulesRes.error) throw workoutSchedulesRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (workoutsRes.error) throw workoutsRes.error;

      setClasses((classesRes.data || []) as unknown as Class[]);
      setWorkoutSchedules((workoutSchedulesRes.data || []) as unknown as WorkoutSchedule[]);
      setProfiles(profilesRes.data || []);
      setWorkouts(workoutsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch schedules data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          ...classForm,
          status: 'scheduled'
        }])
        .select()
        .single();

      if (error) throw error;

      // Sync attendees bookings (ignore errors but log)
      try {
        if (data?.id) {
          await syncClassBookings(data.id, selectedMemberIds);
        }
      } catch (e) {
        console.error('Failed to sync attendees for new class:', e);
      }

      toast({
        title: "Success",
        description: "Class created successfully",
      });
      
      fetchData();
      setShowClassDialog(false);
      resetClassForm();
    } catch (error) {
      console.error('Error creating class:', error);
      toast({
        title: "Error",
        description: "Failed to create class",
        variant: "destructive",
      });
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;

    try {
      const { error } = await supabase
        .from('classes')
        .update(classForm)
        .eq('id', editingClass.id);

      if (error) throw error;

      // Sync attendees bookings (ignore errors but log)
      try {
        await syncClassBookings(editingClass.id, selectedMemberIds);
      } catch (e) {
        console.error('Failed to sync attendees for class update:', e);
      }

      toast({
        title: "Success",
        description: "Class updated successfully",
      });
      
      fetchData();
      setShowClassDialog(false);
      setEditingClass(null);
      resetClassForm();
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        title: "Error",
        description: "Failed to update class",
        variant: "destructive",
      });
    }
  };

  // Load existing bookings for a class and return member IDs
  const fetchClassBookings = async (classId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('class_bookings')
      .select('user_id')
      .eq('class_id', classId);
    if (error) {
      console.error('Error fetching class bookings:', error);
      return [];
    }
    return (data || []).map((b: any) => b.user_id);
  };

  // Sync class_bookings to match selected members
  const syncClassBookings = async (classId: string, memberIds: string[]) => {
    // Fetch existing bookings
    const { data: existing, error: existingError } = await supabase
      .from('class_bookings')
      .select('id, user_id')
      .eq('class_id', classId);

    if (existingError) throw existingError;

    const existingIds = new Set((existing || []).map((b: any) => b.user_id));
    const desiredIds = new Set(memberIds);

    const toAdd = [...desiredIds].filter((id) => !existingIds.has(id));
    const toRemove = (existing || []).filter((b: any) => !desiredIds.has(b.user_id));

    if (toAdd.length > 0) {
      const { error: addError } = await supabase.from('class_bookings').insert(
        toAdd.map((userId) => ({ class_id: classId, user_id: userId, status: 'confirmed' as const }))
      );
      if (addError) throw addError;
    }

    if (toRemove.length > 0) {
      const { error: delError } = await supabase
        .from('class_bookings')
        .delete()
        .in('id', toRemove.map((b: any) => b.id));
      if (delError) throw delError;
    }
  };

  const handleCreateWorkoutSchedule = async () => {
    try {
      const { error } = await supabase
        .from('workout_schedules')
        .insert([workoutForm]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Workout scheduled successfully",
      });
      
      fetchData();
      setShowWorkoutDialog(false);
      resetWorkoutForm();
    } catch (error) {
      console.error('Error creating workout schedule:', error);
      toast({
        title: "Error",
        description: "Failed to schedule workout",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWorkoutSchedule = async () => {
    if (!editingWorkout) return;

    try {
      const { error } = await supabase
        .from('workout_schedules')
        .update(workoutForm)
        .eq('id', editingWorkout.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Workout schedule updated successfully",
      });
      
      fetchData();
      setShowWorkoutDialog(false);
      setEditingWorkout(null);
      resetWorkoutForm();
    } catch (error) {
      console.error('Error updating workout schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update workout schedule",
        variant: "destructive",
      });
    }
  };

  const resetClassForm = () => {
    setClassForm({
      name: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      max_capacity: 20,
      room_location: '',
      trainer_id: ''
    });
    setSelectedMemberIds([]);
  };

  const resetWorkoutForm = () => {
    setWorkoutForm({
      user_id: '',
      workout_id: '',
      trainer_id: '',
      scheduled_date: '',
      scheduled_time: '',
      notes: ''
    });
  };

  const editClass = async (classItem: Class) => {
    setEditingClass(classItem);
    setClassForm({
      name: classItem.name,
      description: classItem.description || '',
      date: classItem.date,
      start_time: classItem.start_time,
      end_time: classItem.end_time,
      max_capacity: classItem.max_capacity,
      room_location: classItem.room_location || '',
      trainer_id: classItem.trainer_id
    });
    // Load existing attendees
    const bookedMembers = await fetchClassBookings(classItem.id);
    setSelectedMemberIds(bookedMembers);
    setShowClassDialog(true);
  };

  const editWorkoutSchedule = (schedule: WorkoutSchedule) => {
    setEditingWorkout(schedule);
    setWorkoutForm({
      user_id: schedule.user_id,
      workout_id: schedule.workout_id,
      trainer_id: schedule.trainer_id,
      scheduled_date: schedule.scheduled_date,
      scheduled_time: schedule.scheduled_time,
      notes: schedule.notes || ''
    });
    setShowWorkoutDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-primary/20 text-primary-foreground/80 border-primary/30';
      case 'completed': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'cancelled': return 'bg-destructive/20 text-destructive-foreground/80 border-destructive/30';
      default: return 'bg-muted/40 text-muted-foreground border-muted/40';
    }
  };

  const trainers = profiles.filter(p => p.role === 'trainer' || p.role === 'admin');
  const members = profiles.filter(p => p.role === 'member');

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Schedule Management
        </h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setActiveTab('classes')}
            variant={activeTab === 'classes' ? 'default' : 'outline'}
          >
            Classes
          </Button>
          <Button 
            onClick={() => setActiveTab('workouts')}
            variant={activeTab === 'workouts' ? 'default' : 'outline'}
          >
            Personal Training
          </Button>
        </div>
      </div>

      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Group Classes</h2>
            <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" onClick={() => { setEditingClass(null); resetClassForm(); setSelectedMemberIds([]); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingClass ? 'Edit Class' : 'Create New Class'}</DialogTitle>
                  <DialogDescription>
                    {editingClass ? 'Update class details' : 'Add a new group fitness class'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="className">Class Name</Label>
                    <Input
                      id="className"
                      value={classForm.name}
                      onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                      placeholder="e.g., Morning Yoga"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={classForm.description}
                      onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                      placeholder="Class description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={classForm.date}
                        onChange={(e) => setClassForm({ ...classForm, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Max Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={classForm.max_capacity}
                        onChange={(e) => setClassForm({ ...classForm, max_capacity: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={classForm.start_time}
                        onChange={(e) => setClassForm({ ...classForm, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={classForm.end_time}
                        onChange={(e) => setClassForm({ ...classForm, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="room">Room/Location</Label>
                    <Input
                      id="room"
                      value={classForm.room_location}
                      onChange={(e) => setClassForm({ ...classForm, room_location: e.target.value })}
                      placeholder="e.g., Studio A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trainer">Trainer</Label>
                    <Select value={classForm.trainer_id} onValueChange={(value) => setClassForm({ ...classForm, trainer_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trainer" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.first_name} {trainer.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Attendees</Label>
                    <ScrollArea className="h-40 rounded-md border p-2">
                      <div className="space-y-2">
                        {members.map((member) => {
                          const checked = selectedMemberIds.includes(member.id);
                          return (
                            <label key={member.id} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => {
                                  const isChecked = Boolean(value);
                                  setSelectedMemberIds((prev) =>
                                    isChecked ? [...prev, member.id] : prev.filter((id) => id !== member.id)
                                  );
                                }}
                              />
                              <span>{member.first_name} {member.last_name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedMemberIds.length}/{classForm.max_capacity} selected
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowClassDialog(false);
                    setEditingClass(null);
                    resetClassForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={editingClass ? handleUpdateClass : handleCreateClass}>
                    {editingClass ? 'Update' : 'Create'} Class
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{classItem.name}</CardTitle>
                    <Badge className={getStatusColor(classItem.status)}>
                      {classItem.status}
                    </Badge>
                  </div>
                  <CardDescription>{classItem.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(classItem.date), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {classItem.start_time} - {classItem.end_time}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {classItem.current_bookings}/{classItem.max_capacity} enrolled
                  </div>
                  {classItem.room_location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {classItem.room_location}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">Trainer: </span>
                    {classItem.profiles?.first_name} {classItem.profiles?.last_name}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => editClass(classItem)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Personal Training Sessions</h2>
            <Dialog open={showWorkoutDialog} onOpenChange={setShowWorkoutDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingWorkout ? 'Edit Session' : 'Schedule New Session'}</DialogTitle>
                  <DialogDescription>
                    {editingWorkout ? 'Update session details' : 'Schedule a personal training session'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="member">Member</Label>
                    <Select value={workoutForm.user_id} onValueChange={(value) => setWorkoutForm({ ...workoutForm, user_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="workout">Workout</Label>
                    <Select value={workoutForm.workout_id} onValueChange={(value) => setWorkoutForm({ ...workoutForm, workout_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workout" />
                      </SelectTrigger>
                      <SelectContent>
                        {workouts.map((workout) => (
                          <SelectItem key={workout.id} value={workout.id}>
                            {workout.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="workoutTrainer">Trainer</Label>
                    <Select value={workoutForm.trainer_id} onValueChange={(value) => setWorkoutForm({ ...workoutForm, trainer_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trainer" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.first_name} {trainer.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduleDate">Date</Label>
                      <Input
                        id="scheduleDate"
                        type="date"
                        value={workoutForm.scheduled_date}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, scheduled_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduleTime">Time</Label>
                      <Input
                        id="scheduleTime"
                        type="time"
                        value={workoutForm.scheduled_time}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, scheduled_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={workoutForm.notes}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                      placeholder="Session notes..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowWorkoutDialog(false);
                    setEditingWorkout(null);
                    resetWorkoutForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={editingWorkout ? handleUpdateWorkoutSchedule : handleCreateWorkoutSchedule}>
                    {editingWorkout ? 'Update' : 'Schedule'} Session
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workoutSchedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{schedule.workouts?.name}</CardTitle>
                    <Badge className={schedule.completed ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-blue-500/20 text-blue-700 border-blue-500/30'}>
                      {schedule.completed ? 'Completed' : 'Scheduled'}
                    </Badge>
                  </div>
                  <CardDescription>{schedule.workouts?.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(schedule.scheduled_date), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {schedule.scheduled_time}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Member: </span>
                    {schedule.profiles?.first_name} {schedule.profiles?.last_name}
                  </div>
                  {schedule.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Notes: </span>
                      {schedule.notes}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => editWorkoutSchedule(schedule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}