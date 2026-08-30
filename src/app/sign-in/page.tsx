import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <div className="site-wrapper">
      <SiteHeader />
      <Suspense fallback={<main className="sign-in-page"><p>Loading secure sign-in…</p></main>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
