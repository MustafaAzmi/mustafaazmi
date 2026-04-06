import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Unlock, Brain, Sparkles } from "lucide-react";

interface Puzzle {
  id: string;
  level: number;
  question: string;
  answer: string;
  hint_reward: string;
  difficulty: string;
}

interface PuzzleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puzzle: Puzzle | null;
  onSolved: (puzzleId: string, hintReward: string) => void;
}

const PuzzleModal = ({ open, onOpenChange, puzzle, onSolved }: PuzzleModalProps) => {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"idle" | "correct" | "wrong">("idle");

  if (!puzzle) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = answer.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const expected = puzzle.answer.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    if (normalized === expected) {
      setResult("correct");
      setTimeout(() => {
        onSolved(puzzle.id, puzzle.hint_reward);
        setAnswer("");
        setResult("idle");
        onOpenChange(false);
      }, 1500);
    } else {
      setResult("wrong");
      setTimeout(() => setResult("idle"), 1500);
    }
  };

  const difficultyColor = {
    easy: "text-green-400",
    medium: "text-mystery-warm",
    hard: "text-pink-400",
    expert: "text-destructive",
  }[puzzle.difficulty] || "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 backdrop-blur-xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Puzzle Level {puzzle.level}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-medium uppercase ${difficultyColor}`}>
              {puzzle.difficulty}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Solve to reveal a hint
            </span>
          </div>

          <div className="rounded-lg border border-border/50 bg-secondary/50 p-4">
            <p className="text-sm leading-relaxed">{puzzle.question}</p>
          </div>

          {result === "correct" ? (
            <div className="text-center space-y-2 animate-fade-in">
              <div className="inline-flex items-center gap-2 text-green-400">
                <Unlock className="h-5 w-5" />
                <span className="font-medium">Unlocked!</span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                {puzzle.hint_reward}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer…"
                className="bg-secondary/50 border-border/50"
                autoFocus
              />
              {result === "wrong" && (
                <p className="text-xs text-destructive animate-fade-in">
                  Not quite… the shadows keep their secrets 👀
                </p>
              )}
              <Button
                type="submit"
                disabled={answer.trim().length === 0}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Attempt to solve
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PuzzleModal;
