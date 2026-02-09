export function DotsBounceIcon({
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    fill = 'none',
    gap = 8,
    className,
    ...props
}: React.SVGProps<SVGSVGElement> & {
    size?: number;
    color?: string;
    strokeWidth?: number;
    gap?: number;
}) {
    const cx1 = 4;
    const cx2 = 4 + gap;
    const cx3 = 4 + gap * 2;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={fill}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <circle cx={cx1} cy="12" r="3">
                <animate
                    id="ani1"
                    attributeName="cy"
                    begin="0;ani3.end+0.25s"
                    calcMode="spline"
                    dur="0.6s"
                    keySplines=".33,.66,.66,1;.33,0,.66,.33"
                    values="12;6;12"
                />
            </circle>
            <circle cx={cx2} cy="12" r="3">
                <animate
                    attributeName="cy"
                    begin="ani1.begin+0.1s"
                    calcMode="spline"
                    dur="0.6s"
                    keySplines=".33,.66,.66,1;.33,0,.66,.33"
                    values="12;6;12"
                />
            </circle>
            <circle cx={cx3} cy="12" r="3">
                <animate
                    id="ani3"
                    attributeName="cy"
                    begin="ani1.begin+0.2s"
                    calcMode="spline"
                    dur="0.6s"
                    keySplines=".33,.66,.66,1;.33,0,.66,.33"
                    values="12;6;12"
                />
            </circle>
        </svg>
    );
}
