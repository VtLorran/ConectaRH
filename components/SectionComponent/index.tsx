import { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export default function SectionComponent({
  children,
  className = "",
  ...rest
}: Props) {
  return (
    <section
      className={`p-5 flex flex-col items-center gap-5 w-full max-w-[1400px] mx-auto animate-fade-in ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}
