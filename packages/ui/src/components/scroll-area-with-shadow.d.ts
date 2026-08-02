import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { ComponentPropsWithoutRef, PropsWithChildren, Ref } from 'react';
type ScrollAreaProps = ComponentPropsWithoutRef<typeof ScrollArea>;
interface ScrollAreaWithShadowProps extends Omit<ScrollAreaProps, 'ref' | 'viewportRef'> {
    bottomShadow?: boolean;
    orientation?: 'vertical' | 'horizontal' | 'both';
    ref?: Ref<HTMLDivElement>;
}
export declare function ScrollAreaWithShadow({
    children,
    bottomShadow,
    orientation,
    className,
    viewportClassName,
    ref,
    ...props
}: PropsWithChildren<ScrollAreaWithShadowProps>): import('react/jsx-runtime').JSX.Element;
export {};
