"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { Calendar, Mail, User as UserIcon, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ProfileInfo() {
  const { user, selectedPet, setSelectedPet } = useAuthStore();
  const { toast } = useToast();

  if (!user) return null;

  const handlePetSelection = (petId: 'dog' | 'cat' | 'fox' | 'robot' | 'bunny', petName: string) => {
    setSelectedPet(petId);
    toast({
      title: "Companion Updated!",
      description: `${petName} is now your active coding assistant. Check My Lab to see them!`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account details and information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium text-white">{user.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium text-white">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-white">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <p className="font-medium text-white">{user.isVerified ? "Verified ✓" : "Unverified"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companion Selector Card */}
      <Card className="border-2 border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Choose Your Companion</span>
          </CardTitle>
          <CardDescription>Select the mascot that guides you through modules, dashboard workspaces, and loading screens.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { id: 'dog', name: 'Rover', emoji: '🐕', desc: 'Loyal Debugger' },
              { id: 'cat', name: 'Mochi', emoji: '🐱', desc: 'Bug Hunter' },
              { id: 'fox', name: 'Foxy', emoji: '🦊', desc: 'Algo Wizard' },
              { id: 'robot', name: 'Sparky', emoji: '🤖', desc: 'Byte Compiler' },
              { id: 'bunny', name: 'Hoppy', emoji: '🐰', desc: 'Agile Runner' },
            ].map((pet) => (
              <button
                key={pet.id}
                onClick={() => handlePetSelection(pet.id as any, pet.name)}
                className={`p-4 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-between gap-2 group hover:scale-105 ${
                  selectedPet === pet.id
                    ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-primary/45 hover:bg-primary/5'
                }`}
              >
                <span className="text-4xl select-none group-hover:scale-110 transition-transform duration-300">{pet.emoji}</span>
                <div>
                  <p className="font-bold text-sm text-white">{pet.name}</p>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-tight mt-0.5">{pet.desc}</p>
                </div>
                {selectedPet === pet.id ? (
                  <span className="text-[10px] font-bold text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full mt-1">
                    Companion
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-gray-400 group-hover:text-primary transition-colors mt-1">
                    Select
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
