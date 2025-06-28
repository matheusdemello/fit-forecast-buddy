import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Exercise } from '../types/workout';

interface ExerciseSelectorProps {
  exercises: Exercise[];
  selectedExercise: string;
  onSelectedExerciseChange: (value: string) => void;
  onAddExercise: () => void;
  onCreateExercise?: (name: string) => Promise<Exercise | null>;
}

const ExerciseSelector = ({ 
  exercises, 
  selectedExercise, 
  onSelectedExerciseChange, 
  onAddExercise,
  onCreateExercise
}: ExerciseSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedExerciseData = exercises.find(exercise => exercise.id === selectedExercise);

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (exerciseId: string) => {
    onSelectedExerciseChange(exerciseId);
    setOpen(false);
    setSearchValue('');
  };

  const handleCreateNewExercise = async () => {
    if (!searchValue.trim() || !onCreateExercise) return;
    
    const newExercise = await onCreateExercise(searchValue.trim());
    if (newExercise) {
      onSelectedExerciseChange(newExercise.id);
      setOpen(false);
      setSearchValue('');
    }
  };

  const exactMatch = exercises.find(exercise => 
    exercise.name.toLowerCase() === searchValue.toLowerCase()
  );

  const showCreateOption = searchValue.trim() && !exactMatch && onCreateExercise;

  return (
    <Card className="p-4">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              {selectedExerciseData ? selectedExerciseData.name : "Select or type exercise..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput 
                placeholder="Search or type new exercise..." 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                {filteredExercises.length === 0 && !showCreateOption && (
                  <CommandEmpty>No exercises found.</CommandEmpty>
                )}
                
                {filteredExercises.length > 0 && (
                  <CommandGroup heading="Existing Exercises">
                    {filteredExercises.map((exercise) => (
                      <CommandItem
                        key={exercise.id}
                        value={exercise.id}
                        onSelect={() => handleSelect(exercise.id)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span>{exercise.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {exercise.category} • {exercise.muscle_groups.join(', ')}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedExercise === exercise.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {showCreateOption && (
                  <CommandGroup heading="Create New">
                    <CommandItem
                      onSelect={handleCreateNewExercise}
                      className="flex items-center gap-2 text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create "{searchValue}"</span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button onClick={onAddExercise} disabled={!selectedExercise}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ExerciseSelector;
