<?php

namespace Tests\Unit;

use App\Enums\AutorizadoStatus;
use App\Enums\UserRole;
use PHPUnit\Framework\TestCase;

class EnumsTest extends TestCase
{
    public function test_user_role_values_labels_and_helpers(): void
    {
        $this->assertSame(1, UserRole::Staff->value);
        $this->assertSame(2, UserRole::Nutri->value);
        $this->assertSame(3, UserRole::Diretor->value);

        $this->assertSame('Inspetora', UserRole::Staff->label());
        $this->assertSame('Nutricionista', UserRole::Nutri->label());
        $this->assertSame('Diretoria', UserRole::Diretor->label());

        $this->assertTrue(UserRole::Staff->isStaff());
        $this->assertFalse(UserRole::Staff->isNutri());
        $this->assertFalse(UserRole::Staff->isDiretor());

        $this->assertTrue(UserRole::Nutri->isNutri());
        $this->assertFalse(UserRole::Nutri->isStaff());
        $this->assertFalse(UserRole::Nutri->isDiretor());

        $this->assertTrue(UserRole::Diretor->isDiretor());
        $this->assertFalse(UserRole::Diretor->isStaff());
        $this->assertFalse(UserRole::Diretor->isNutri());
    }

    public function test_autorizado_status_values_labels_and_helpers(): void
    {
        $this->assertSame('pendente', AutorizadoStatus::Pendente->value);
        $this->assertSame('confirmado', AutorizadoStatus::Confirmado->value);
        $this->assertSame('recusado', AutorizadoStatus::Recusado->value);

        $this->assertSame('Pendente', AutorizadoStatus::Pendente->label());
        $this->assertSame('Confirmado', AutorizadoStatus::Confirmado->label());
        $this->assertSame('Recusado', AutorizadoStatus::Recusado->label());

        $this->assertTrue(AutorizadoStatus::Pendente->isPendente());
        $this->assertFalse(AutorizadoStatus::Pendente->isConfirmado());

        $this->assertTrue(AutorizadoStatus::Confirmado->isConfirmado());
        $this->assertFalse(AutorizadoStatus::Confirmado->isPendente());
    }
}
