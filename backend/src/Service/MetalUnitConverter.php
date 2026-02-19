<?php

namespace App\Service;

final class MetalUnitConverter
{
    public const GRAMS_PER_TROY_OUNCE = 31.1034768;

    /**
     * @return string Ounces formatted to 8 decimals.
     */
    public function gramsToTroyOunces(string $grams): string
    {
        $gramsFloat = (float) $grams;
        $ounces = $gramsFloat / self::GRAMS_PER_TROY_OUNCE;

        return number_format($ounces, 8, '.', '');
    }

    /**
     * @return string Grams formatted to 8 decimals.
     */
    public function troyOuncesToGrams(string $ounces): string
    {
        $ouncesFloat = (float) $ounces;
        $grams = $ouncesFloat * self::GRAMS_PER_TROY_OUNCE;

        return number_format($grams, 8, '.', '');
    }
}
