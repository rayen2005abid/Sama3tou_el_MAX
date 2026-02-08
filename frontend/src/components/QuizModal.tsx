
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/services/api";
import { toast } from "sonner";

interface QuizModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function QuizModal({ open, onOpenChange, onComplete }: QuizModalProps) {
    const [knowledgeStr, setKnowledgeStr] = useState("new");
    const [risk, setRisk] = useState([5]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            await api.submitQuiz(knowledgeStr, risk[0]);
            toast.success("Profile updated successfully!");
            onComplete();
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to update profile.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Customize Your Experience</DialogTitle>
                    <DialogDescription>
                        Help us tailor the AI advice to your level.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-4">
                        <Label className="text-base">What is your trading experience?</Label>
                        <RadioGroup defaultValue="new" value={knowledgeStr} onValueChange={setKnowledgeStr} className="flex flex-col space-y-2 mt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new" id="r1" />
                                <Label htmlFor="r1" className="font-normal">I am new to trading</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="basics" id="r2" />
                                <Label htmlFor="r2" className="font-normal">I know the basics (no experience)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="active" id="r3" />
                                <Label htmlFor="r3" className="font-normal">I am actively trading</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <Label>Risk Tolerance (0-10)</Label>
                            <span className="text-sm text-muted-foreground">{risk[0]}/10</span>
                        </div>
                        <Slider value={risk} onValueChange={setRisk} max={10} step={1} />
                        <p className="text-xs text-muted-foreground">
                            0 = Avoid Loss, 10 = High Risk High Reward
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Profile"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
