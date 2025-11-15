import { useState } from 'react';

export function useKeyValueState() {
    const [key, setKey] = useState('');
    const [value, setValue] = useState('');

    const reset = () => {
        setKey('');
        setValue('');
    };

    return { key, value, setKey, setValue, reset };
}
