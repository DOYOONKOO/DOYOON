"use client";

import { useState } from "react";
import { useApp } from "../../lib/moa/store";
import type { Card } from "../../lib/moa/types";
import { Button, Field, Modal, Notice, inputClass } from "./ui";

const ISSUERS = [
  "삼성카드",
  "신한카드",
  "현대카드",
  "KB국민카드",
  "롯데카드",
  "우리카드",
  "하나카드",
  "BC카드",
  "NH농협카드",
  "카카오뱅크",
  "토스뱅크",
];

export default function CardForm({
  editing,
  onClose,
}: {
  editing?: Card;
  onClose: () => void;
}) {
  const { actions, toast } = useApp();
  const [nickname, setNickname] = useState(editing?.nickname ?? "");
  const [issuer, setIssuer] = useState(editing?.issuer ?? "");
  const [last4, setLast4] = useState(editing?.last4 ?? "");
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    nickname: nickname.trim() === "" ? "카드 별칭을 입력해 주세요." : "",
    issuer: issuer.trim() === "" ? "카드사를 입력하거나 선택해 주세요." : "",
    last4: /^\d{4}$/.test(last4) ? "" : "끝 4자리 숫자를 입력해 주세요.",
  };
  const hasError = Object.values(errors).some(Boolean);
  const show = (msg: string) => (submitted ? msg : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (hasError) return;
    const input = { nickname: nickname.trim(), issuer: issuer.trim(), last4 };
    if (editing) {
      actions.updateCard(editing.id, input);
      toast("카드 정보를 수정했어요.");
    } else {
      actions.addCard(input);
      toast("결제 수단을 추가했어요.");
    }
    onClose();
  }

  return (
    <Modal
      title={editing ? "결제 수단 수정" : "결제 수단 추가"}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="card-form" className="flex-[2]">
            {editing ? "저장하기" : "추가하기"}
          </Button>
        </div>
      }
    >
      <form id="card-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Notice>
          관리용 정보예요. 카드번호 전체, CVC, 비밀번호는 입력받지 않고, 실제 카드와 연결되지도
          않아요.
        </Notice>
        <Field label="카드 별칭" error={show(errors.nickname)}>
          <input
            className={inputClass}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="예: 생활비 카드"
            maxLength={20}
          />
        </Field>
        <Field label="카드사" error={show(errors.issuer)}>
          <input
            className={inputClass}
            list="card-issuers"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="선택하거나 직접 입력"
            maxLength={20}
          />
          <datalist id="card-issuers">
            {ISSUERS.map((i) => (
              <option key={i} value={i} />
            ))}
          </datalist>
        </Field>
        <Field label="끝 4자리" error={show(errors.last4)}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="1234"
          />
        </Field>
      </form>
    </Modal>
  );
}
