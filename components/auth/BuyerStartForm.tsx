"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VeluLogo } from "@/components/shared/VeluLogo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBuyerStart } from "@/lib/buyer-start";

type BuyerStartFormProps = {
  onSignIn: () => void;
};

export function BuyerStartForm({ onSignIn }: BuyerStartFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [plotAddress, setPlotAddress] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveBuyerStart({
      fullName: fullName.trim(),
      phone: phone.trim(),
      plotAddress: plotAddress.trim(),
    });
    router.push("/login/land");
  }

  return (
    <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
      <CardHeader className="space-y-4">
        <VeluLogo size="lg" href="/login" />
        <div className="space-y-2">
          <CardTitle className="text-2xl">Register the block. Decide the build.</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Velu is for the land you already have. Add who you are and the plot
            address first. The next page registers the block and signs you in.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-name">Name</Label>
            <Input
              id="start-name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              placeholder="Sam Chen"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-phone">Number</Label>
            <Input
              id="start-phone"
              name="tel"
              type="tel"
              autoComplete="tel"
              required
              minLength={8}
              placeholder="0412 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-plot">Plot address</Label>
            <Input
              id="start-plot"
              name="street-address"
              autoComplete="street-address"
              required
              minLength={5}
              placeholder="7 Wattle Grove, Leumeah NSW 2560"
              value={plotAddress}
              onChange={(e) => setPlotAddress(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 w-full rounded-full text-base">
            Next
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button type="button" className="text-link" onClick={onSignIn}>
            Sign in
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
