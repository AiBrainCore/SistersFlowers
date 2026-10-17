import "react";

type ModelViewerAttributes = React.HTMLAttributes<HTMLElement> & {
  src?: string;
  poster?: string;
  alt?: string;
  "camera-controls"?: boolean | string;
  "touch-action"?: string;
  "auto-rotate"?: boolean | string;
  "auto-rotate-delay"?: string | number;
  "rotation-per-second"?: string;
  "shadow-intensity"?: string | number;
  "shadow-softness"?: string | number;
  exposure?: string | number;
  "environment-image"?: string;
  "interaction-prompt"?: string;
  "interaction-prompt-threshold"?: string | number;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

export {};
