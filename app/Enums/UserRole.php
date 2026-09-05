<?php

namespace App\Enums;

enum UserRole: int
{
    case Staff = 1;
    case Nutri = 2;
    case Diretor = 3;

    public function label(): string
    {
        return match ($this) {
            self::Staff => 'Inspetora',
            self::Nutri => 'Nutricionista',
            self::Diretor => 'Diretoria',
        };
    }

    public function isNutri(): bool
    {
        return $this === self::Nutri;
    }

    public function isStaff(): bool
    {
        return $this === self::Staff;
    }

    public function isDiretor(): bool
    {
        return $this === self::Diretor;
    }
}
