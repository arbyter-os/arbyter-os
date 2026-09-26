import Link from "next/link";
import { PageFrame } from "@/components/site/PageFrame";

export default function SignUpPage() {
  return (
    <PageFrame
      eyebrow="SIGN UP / ARBYTER"
      title={<>Bring your AI workforce<br /><em>under governance.</em></>}
      intro="Arbyter is being built for organizations that need a clear runtime boundary around AI agents. Start with a product conversation and we can help define the right governance scope."
    >
      <section className="resource-system">
        <div className="resource-index">
          <article>
            <span>01</span>
            <div>
              <small>ACCESS</small>
              <h2>Start with your governance boundary.</h2>
              <p>Tell us what you are building, how many agents you expect to operate, and which actions need controls. A guided start keeps the first deployment focused on a real workflow instead of creating an empty account with no governance context.</p>
              <Link href="/demo" className="site-enter" style={{display:"inline-flex",marginTop:20}}>BOOK YOUR SLOT</Link>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <small>WHAT COMES NEXT</small>
              <h2>Discover. Connect. Govern.</h2>
              <p>The initial Arbyter workflow is designed around discovering the agents you already have, understanding their capabilities, defining organizational policies, evaluating actions at runtime and keeping the resulting audit trail.</p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <small>SELF-SERVE</small>
              <h2>Account creation is not being faked.</h2>
              <p>The public site currently uses a guided access flow rather than exposing an unverified self-serve signup endpoint. This keeps authentication and organization provisioning separate from marketing UI until that production flow is ready.</p>
              <Link href="/login" style={{display:"inline-flex",marginTop:20,textDecoration:"underline"}}>ALREADY HAVE AN ACCOUNT? SIGN IN</Link>
            </div>
          </article>
        </div>
      </section>
    </PageFrame>
  );
}
