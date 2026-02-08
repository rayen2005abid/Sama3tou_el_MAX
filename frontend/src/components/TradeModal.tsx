
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    symbol: string;
    currentPrice: number;
    action?: "BUY" | "SELL";
    onSuccess?: () => void;
}

export function TradeModal({ isOpen, onClose, symbol, currentPrice, action = "BUY", onSuccess }: TradeModalProps) {
    const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            quantity: 1
        }
    });

    const quantity = watch("quantity");
    const total = (quantity || 0) * currentPrice;

    const onSubmit = async (data: any) => {
        try {
            await api.executeTransaction(symbol, data.quantity, action, currentPrice);
            toast.success(`${action} order for ${symbol} executed successfully!`);
            reset();
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Transaction failed");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{action} {symbol} <span className="text-muted-foreground text-sm font-normal">(Virtual)</span></DialogTitle>
                    <DialogDescription>
                        Current Price: {currentPrice.toFixed(2)} TND. This is a simulation.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">
                                Quantity
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                className="col-span-3"
                                {...register("quantity", { required: true, min: 1 })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Total</Label>
                            <div className="col-span-3 font-bold">
                                {total.toFixed(2)} TND
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Virtual Order"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
