
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const { register, handleSubmit, control, setValue, reset, watch, formState: { isSubmitting } } = useForm();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userData = await api.getMe();
                setUser(userData);

                // Parse comma-separated strings back to arrays if needed for UI logic, 
                // but for simple checkboxes we might handle it differently.
                // Let's assume we handle array <-> string conversion in submit/load

                reset({
                    full_name: userData.full_name || "",
                    age: userData.age || "",
                    initial_capital: userData.initial_capital || 10000,
                    trading_experience: userData.trading_experience || "new",
                    risk_profile: userData.risk_profile || "moderate",
                    // For checkboxes, we need to map string to boolean map or array
                    preferred_investment_types: userData.preferred_investment_types ? userData.preferred_investment_types.split(",") : ["stocks"],
                    notification_preferences: userData.notification_preferences ? userData.notification_preferences.split(",") : ["email", "app"],
                });
            } catch (error) {
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [reset]);

    const onSubmit = async (data: any) => {
        try {
            // Convert arrays back to comma-separated strings
            const formattedData = {
                ...data,
                preferred_investment_types: Array.isArray(data.preferred_investment_types) ? data.preferred_investment_types.join(",") : data.preferred_investment_types,
                notification_preferences: Array.isArray(data.notification_preferences) ? data.notification_preferences.join(",") : data.notification_preferences,
            };

            await api.updateProfile(formattedData);
            toast.success("Profile updated successfully!");
            // Reload user data to confirm
            const updatedUser = await api.getMe();
            setUser(updatedUser);
        } catch (error: any) {
            toast.error("Failed to update profile");
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Decision Agent Profile</CardTitle>
                    <CardDescription>Update your personal information and investment preferences to get tailored recommendations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* 1. Personal Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input id="full_name" placeholder="John Doe" {...register("full_name", { required: "Full Name is required" })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input id="age" type="number" placeholder="30" {...register("age", { valueAsNumber: true, min: 18 })} />
                            </div>
                        </div>

                        {/* 2. Login Info (Read Only) */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email / Login</Label>
                            <Input id="email" value={user?.email || user?.username || ""} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Username/Email cannot be changed.</p>
                        </div>

                        {/* 3. Financial Profile */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="initial_capital">Initial Capital (TND)</Label>
                                <Input id="initial_capital" type="number" {...register("initial_capital", { valueAsNumber: true, min: 0 })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="trading_experience">Investment Experience</Label>
                                <Controller
                                    name="trading_experience"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select experience" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="new">Beginner</SelectItem>
                                                <SelectItem value="basics">Intermediate</SelectItem>
                                                <SelectItem value="active">Advanced</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="risk_profile">Risk Tolerance</Label>
                            <Controller
                                name="risk_profile"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select risk tolerance" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="conservative">Conservative (Low Risk)</SelectItem>
                                            <SelectItem value="moderate">Moderate (Medium Risk)</SelectItem>
                                            <SelectItem value="aggressive">Aggressive (High Risk)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* 4. Preferred Investment Types (Checkboxes) */}
                        <div className="space-y-2">
                            <Label className="text-base">Preferred Investment Types</Label>
                            <div className="flex flex-wrap gap-4 border p-4 rounded-md">
                                <Controller
                                    name="preferred_investment_types"
                                    control={control}
                                    defaultValue={["stocks"]}
                                    render={({ field }) => {
                                        const values = field.value || [];
                                        const handleCheck = (checked: boolean, item: string) => {
                                            if (checked) {
                                                field.onChange([...values, item]);
                                            } else {
                                                field.onChange(values.filter((v: string) => v !== item));
                                            }
                                        };

                                        const types = [
                                            { id: "stocks", label: "Stocks" },
                                            { id: "bonds", label: "Bonds" },
                                            { id: "etfs", label: "ETFs" },
                                            { id: "crypto", label: "Crypto" },
                                            { id: "real_estate", label: "Real Estate" }
                                        ];

                                        return (
                                            <>
                                                {types.map((type) => (
                                                    <div key={type.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`type-${type.id}`}
                                                            checked={values.includes(type.id)}
                                                            onCheckedChange={(checked) => handleCheck(checked as boolean, type.id)}
                                                        />
                                                        <Label htmlFor={`type-${type.id}`} className="font-normal">{type.label}</Label>
                                                    </div>
                                                ))}
                                            </>
                                        );
                                    }}
                                />
                            </div>
                        </div>

                        {/* 5. Notification Preferences (Toggle/Switch) */}
                        <div className="space-y-4">
                            <Label className="text-base">Notification Preferences</Label>
                            <div className="space-y-2 border p-4 rounded-md">
                                <Controller
                                    name="notification_preferences"
                                    control={control}
                                    defaultValue={["email", "app"]}
                                    render={({ field }) => {
                                        const values = field.value || [];
                                        const handleToggle = (checked: boolean, item: string) => {
                                            if (checked) {
                                                field.onChange([...values, item]);
                                            } else {
                                                field.onChange(values.filter((v: string) => v !== item));
                                            }
                                        };

                                        return (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="notify-email" className="font-normal">Email Notifications</Label>
                                                    <Switch
                                                        id="notify-email"
                                                        checked={values.includes("email")}
                                                        onCheckedChange={(checked) => handleToggle(checked, "email")}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="notify-app" className="font-normal">In-App Notifications</Label>
                                                    <Switch
                                                        id="notify-app"
                                                        checked={values.includes("app")}
                                                        onCheckedChange={(checked) => handleToggle(checked, "app")}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="notify-sms" className="font-normal">SMS Notifications</Label>
                                                    <Switch
                                                        id="notify-sms"
                                                        checked={values.includes("sms")}
                                                        onCheckedChange={(checked) => handleToggle(checked, "sms")}
                                                    />
                                                </div>
                                            </>
                                        )
                                    }}
                                />
                            </div>
                        </div>


                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Profile"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
