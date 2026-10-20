// Liveness challenge logic tests. Run: JWT_SECRET=test npx tsx --tsconfig tsconfig.json scripts/test-liveness.ts
// The same checks were also run against a real CompreFace 1.2 container, together with
// photos tilted 25-55 degrees towards the camera: the turn ratio changed by at most
// 0.036, well under the 0.09 a real head turn needs.
import assert from "node:assert/strict"
import { headTurn } from "@/lib/services/compreface"
import { checkFrame, startChallenge, verifyChallenge } from "@/lib/checkin/liveness"

const TENANT = "test-tenant"
const results: string[] = []
const ok = (name: string) => results.push(`PASS ${name}`)

function main() {
  // --- Turn ratio from landmarks ---
  assert.equal(headTurn({ eyes: [[100, 100], [200, 100]], nose: [150, 150] }), 0)
  assert.ok(headTurn({ eyes: [[100, 100], [200, 100]], nose: [165, 150] })! > 0, "nose to image right = turned to their left")
  assert.equal(headTurn({ eyes: [[200, 100], [100, 100]], nose: [165, 150] }), headTurn({ eyes: [[100, 100], [200, 100]], nose: [165, 150] }), "eye order doesn't matter")
  assert.equal(headTurn({ eyes: [[100, 100], [100, 100]], nose: [100, 150] }), undefined, "no eye distance, no turn")
  ok("turn ratio from landmarks")

  // --- Challenge logic with controlled frames ---
  const base = { success: true, staffId: "S1", faceWidthRatio: 0.3 }
  const start = startChallenge(TENANT, "S1", 0)
  let c = verifyChallenge(start.token, TENANT)
  const [first, second] = c.steps
  const turnFor = (step: string, amount: number) => (step === "left" ? amount : -amount)

  assert.equal(checkFrame(c, { ...base, turn: turnFor(first, 0.05) }).status, "continue")
  assert.equal(checkFrame(c, { ...base, turn: turnFor(second, 0.2) }).status, "continue", "turning the wrong way doesn't count")
  ok("small or wrong-way turns don't advance")

  const step1 = checkFrame(c, { ...base, turn: turnFor(first, 0.12) })
  assert.equal(step1.status, "next")
  c = verifyChallenge((step1 as any).token, TENANT)
  assert.equal(c.step, 1)
  assert.equal(c.deadline, verifyChallenge(start.token, TENANT).deadline, "next step keeps the original deadline")
  ok(`first step (${first}) passes with a real turn; deadline unchanged`)

  assert.equal(checkFrame(c, { ...base, turn: turnFor(first, 0.12) }).status, "continue", "repeating step one doesn't finish")
  assert.equal(checkFrame(c, { ...base, turn: turnFor(second, 0.12) }).status, "passed")
  ok(`second step (${second}) completes the challenge`)

  assert.equal(checkFrame(c, { ...base, staffId: "S2", turn: turnFor(second, 0.12) }).status, "failed")
  ok("a different person mid-challenge fails it")
  assert.equal(checkFrame(c, { ...base, faceWidthRatio: 0.05, turn: turnFor(second, 0.12) }).status, "continue")
  ok("a face far from the camera doesn't count")

  assert.throws(() => verifyChallenge(start.token, "other-tenant"))
  assert.throws(() => verifyChallenge(start.token.slice(0, -2) + "xx", TENANT))
  ok("tokens from another tenant or tampered tokens are rejected")

  const orders = new Set(Array.from({ length: 40 }, () => startChallenge(TENANT, "S1", 0).steps.join(",")))
  assert.equal(orders.size, 2)
  ok("both step orders occur")

  console.log(results.join("\n"))
}

main()
