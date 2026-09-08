import React, { useEffect, useState } from 'react';
import { fetchProtectedAsset } from '../../services/api';

export const studentPhotoEndpoint = (aluno) => (
    aluno?.foto_url || (aluno?.foto && aluno?.id ? `/api/alunos/${aluno.id}/foto` : null)
);

const ProtectedStudentPhoto = ({ aluno, fallback, alt = 'Aluno', className, ...props }) => {
    const [objectUrl, setObjectUrl] = useState(null);
    const endpoint = studentPhotoEndpoint(aluno);

    useEffect(() => {
        let active = true;
        let nextObjectUrl = null;
        const controller = new AbortController();

        setObjectUrl(null);

        if (!endpoint) {
            return () => controller.abort();
        }

        fetchProtectedAsset(endpoint, { signal: controller.signal })
            .then(blob => {
                if (!active) return;
                nextObjectUrl = URL.createObjectURL(blob);
                setObjectUrl(nextObjectUrl);
            })
            .catch(error => {
                if (error?.name !== 'AbortError') console.error(error);
            });

        return () => {
            active = false;
            controller.abort();
            if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
        };
    }, [endpoint]);

    return (
        <img
            {...props}
            src={objectUrl || fallback}
            alt={alt}
            className={className}
        />
    );
};

export default ProtectedStudentPhoto;
