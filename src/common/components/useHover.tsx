
import React, { useRef, useState, useEffect } from 'react';

// import isMobile from 'ismobilejs'
// import { isMobile } from 'react-device-detect'

const isMob = false; //isMobile(navigator.userAgent).any;

interface IHoverProps {
	isHovered: boolean;
}

export function useHover(): [React.RefObject<null | HTMLDivElement>, IHoverProps] {
	const [hoverProps, setValue] = useState({ isHovered: isMob ? true : false });

	const divRef = useRef<HTMLDivElement>(null);

	const handleMouseOver = () => setValue({ isHovered: true });
	const handleMouseOut = () => setValue({ isHovered: false });

	useEffect(
		() => {
			const node = divRef.current;
			if (node) {
				if (!isMob) {
					node.addEventListener('mouseenter', () => handleMouseOver());
					node.addEventListener('mouseleave', () => handleMouseOut());

					return () => {
						node.removeEventListener('mouseenter', () => handleMouseOver());
						node.removeEventListener('mouseleave', () => handleMouseOut());
					};
				}
			}
		}, []
	);

	return [divRef, hoverProps];
}

