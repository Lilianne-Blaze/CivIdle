import type { ReactNode } from "react";
import { useState } from "react";
import { TypedEvent } from "../../../shared/utilities/TypedEvent";
import { useTypedEvent } from "../utilities/Hook";
import { RenderHTML } from "./RenderHTMLComponent";

const gt = globalThis as any;

const showModalEvent = new TypedEvent<ReactNode>();
gt.showModalEvent = showModalEvent;

const hideModalEvent = new TypedEvent<void>();
gt.hideModalEvent = hideModalEvent;

export function showModal(modal: ReactNode): void {
   showModalEvent.emit(modal);
}
gt.showModal = showModal;

export function hideModal(): void {
   hideModalEvent.emit();
}
gt.hideModal = hideModal;

export function hasOpenModal(): boolean {
   return _hasOpenModal;
}
gt.hasOpenModal = hasOpenModal;

let _hasOpenModal = false;

export function GlobalModal(): React.ReactNode {
   const [content, setContent] = useState<ReactNode>(null);

   useTypedEvent(showModalEvent, (e) => {
      _hasOpenModal = true;
      setContent(e);
   });

   useTypedEvent(hideModalEvent, () => {
      _hasOpenModal = false;
      setContent(null);
   });

   if (!content) {
      return null;
   }

   return <div className="overlay">{content}</div>;
}
gt.GlobalModal = GlobalModal;

const showToastEvent = new TypedEvent<{ timeout: number; content: string }>();
gt.showToastEvent = showToastEvent;

const hideToastEvent = new TypedEvent<void>();
gt.hideToastEvent = hideToastEvent;

export function showToast(content: string, timeout = 5000): void {
   showToastEvent.emit({ content, timeout });
}
gt.showToast = showToast;

export function hideToast(): void {
   if (toastTimeout) {
      clearTimeout(toastTimeout);
   }
   hideToastEvent.emit();
}
gt.hideToast = hideToast;

let toastTimeout = 0;

export function GlobalToast(): React.ReactNode {
   const [content, setContent] = useState<string | null>(null);

   useTypedEvent(showToastEvent, (e) => {
      setContent(e.content);
      if (toastTimeout) {
         clearTimeout(toastTimeout);
      }
      if (Number.isFinite(e.timeout)) {
         toastTimeout = window.setTimeout(() => setContent(null), e.timeout);
      }
   });

   useTypedEvent(hideToastEvent, (e) => {
      setContent(null);
   });

   if (!content) {
      return null;
   }

   return <RenderHTML className="toast" html={content} />;
}
gt.GlobalToast = GlobalToast;

