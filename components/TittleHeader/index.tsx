import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLElement> {
  tittle: string;
  description?: string;
}

export default function TittleHeader({ tittle, description, className="", ...rest }: Props) {
  return (
    <div className={className} {...rest}>
      <h1 className="text-2xl font-semibold text-stone-700/70">{tittle}</h1>
      <p className="text-stone-600/70 mt-1">{description}</p>
    </div>
  );
}
