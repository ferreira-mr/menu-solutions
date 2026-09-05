<?php

namespace App\Enums;

enum AutorizadoStatus: string
{
    case Pendente = 'pendente';
    case Confirmado = 'confirmado';
    case Recusado = 'recusado';

    public function label(): string
    {
        return match ($this) {
            self::Pendente => 'Pendente',
            self::Confirmado => 'Confirmado',
            self::Recusado => 'Recusado',
        };
    }

    public function isPendente(): bool
    {
        return $this === self::Pendente;
    }

    public function isConfirmado(): bool
    {
        return $this === self::Confirmado;
    }
}
