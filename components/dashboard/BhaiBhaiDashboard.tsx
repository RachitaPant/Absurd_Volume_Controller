"use client";

import dynamic from "next/dynamic";
import { MicButton } from "./MicButton";
import { WhatsAppMomCall } from "@/components/gags/WhatsAppMomCall";
import { SumanAuntyBubble } from "@/components/gags/SumanAuntyBubble";
import { SharmaBetaWidget } from "@/components/gags/SharmaBetaWidget";
import { RCBTicker } from "@/components/gags/RCBTicker";
import { ReceiptPrinter } from "@/components/gags/ReceiptPrinter";
import { PowerCut } from "@/components/gags/PowerCut";
import { OverloadEscalation } from "@/components/gags/OverloadEscalation";
import { BhaiBhaiEasterEggs } from "@/components/gags/BhaiBhaiEasterEggs";

const CosmicOrbitScene = dynamic(
  () => import("@/components/scenes/CosmicOrbitScene"),
  { ssr: false },
);

export function BhaiBhaiDashboard() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ── 3D cosmos — full screen backdrop ── */}
      <CosmicOrbitScene />

      {/* ── mic control — bottom center, above the RCB ticker (24px) ── */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
        <MicButton />
      </div>

      {/* ── running gags ── */}
      <WhatsAppMomCall />
      <SumanAuntyBubble />
      <SharmaBetaWidget />
      <RCBTicker />
      <ReceiptPrinter />
      <PowerCut />
      <OverloadEscalation />
      <BhaiBhaiEasterEggs />
    </div>
  );
}
