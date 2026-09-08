<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use DateTimeInterface;

class SchoolCalendarService
{
    public function timezone(): string
    {
        return (string) config('app.school_timezone', 'America/Sao_Paulo');
    }

    public function nowUtc(?DateTimeInterface $instant = null): CarbonImmutable
    {
        if ($instant instanceof CarbonImmutable) {
            return $instant->setTimezone('UTC');
        }

        if ($instant !== null) {
            return CarbonImmutable::instance($instant)->setTimezone('UTC');
        }

        return CarbonImmutable::now('UTC');
    }

    public function nowLocal(?DateTimeInterface $instant = null): CarbonImmutable
    {
        return $this->nowUtc($instant)->setTimezone($this->timezone());
    }

    public function currentDate(): string
    {
        return $this->nowLocal()->toDateString();
    }

    public function currentTime(): string
    {
        return $this->nowLocal()->toTimeString();
    }

    public function dateForInstant(?DateTimeInterface $instant): ?string
    {
        return $instant ? $this->nowLocal($instant)->toDateString() : null;
    }

    public function isCurrentDate(?string $civilDate): bool
    {
        return $civilDate !== null && $civilDate === $this->currentDate();
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public function utcWindowForDate(string $civilDate): array
    {
        $startLocal = CarbonImmutable::createFromFormat(
            '!Y-m-d H:i:s',
            $civilDate.' 00:00:00',
            $this->timezone(),
        );
        $endLocal = $startLocal->addDay();

        return [
            $startLocal->setTimezone('UTC'),
            $endLocal->setTimezone('UTC'),
        ];
    }

    public function metadata(): array
    {
        return [
            'data_atual' => $this->currentDate(),
            'timezone' => $this->timezone(),
            'agora' => $this->nowUtc()->format('Y-m-d\TH:i:s.u\Z'),
        ];
    }
}
