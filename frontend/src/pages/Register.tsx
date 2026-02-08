
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Register() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        try {
            await api.register(data.username, data.password, data.email);
            toast.success("Account created successfully!");
            navigate("/");
        } catch (error: any) {
            toast.error(error.message || "Registration failed");
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Register to start your trading journey.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" {...register("username", { required: true })} />
                            {errors.username && <span className="text-destructive text-sm">Username is required</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email (optional)</Label>
                            <Input id="email" type="email" {...register("email")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...register("password", { required: true, minLength: 6 })} />
                            {errors.password && <span className="text-destructive text-sm">Password must be at least 6 characters</span>}
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>
                </CardContent>
                <div className="p-6 pt-0 flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <a href="/login" className="text-primary hover:underline" onClick={(e) => {
                            e.preventDefault();
                            navigate("/login");
                        }}>
                            Login
                        </a>
                    </p>
                </div>
            </Card>
        </div>
    );
}
