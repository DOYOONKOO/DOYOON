import { Suspense } from "react";
import Ledger from "../components/Ledger";

// 처음에 만든 가계부 (Yoon's cal). 모아구독과는 별개로 /ledger 에 남겨 둠
export default function LedgerPage() {
  return (
    <Suspense fallback={null}>
      <Ledger />
    </Suspense>
  );
}
