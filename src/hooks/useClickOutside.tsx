import { useEffect } from 'react';

import { RefObject } from 'react';

function useClickOutside(ref: RefObject<HTMLElement>, callback: () => void) {
    useEffect(() => {
        function handleClickOutside(event: { target: any; }) {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, callback]);
}

export default useClickOutside;
