package com.careerxera.tax.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val AppTypography = Typography(
    displayLarge  = TextStyle(fontWeight = FontWeight.Bold,        fontSize = 36.sp, lineHeight = 44.sp, letterSpacing = (-0.5).sp),
    displayMedium = TextStyle(fontWeight = FontWeight.Bold,        fontSize = 30.sp, lineHeight = 38.sp),
    headlineLarge = TextStyle(fontWeight = FontWeight.SemiBold,    fontSize = 26.sp, lineHeight = 34.sp),
    headlineMedium= TextStyle(fontWeight = FontWeight.SemiBold,    fontSize = 22.sp, lineHeight = 30.sp),
    titleLarge    = TextStyle(fontWeight = FontWeight.SemiBold,    fontSize = 18.sp, lineHeight = 26.sp),
    titleMedium   = TextStyle(fontWeight = FontWeight.Medium,      fontSize = 16.sp, lineHeight = 22.sp),
    bodyLarge     = TextStyle(fontWeight = FontWeight.Normal,      fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium    = TextStyle(fontWeight = FontWeight.Normal,      fontSize = 14.sp, lineHeight = 21.sp),
    labelLarge    = TextStyle(fontWeight = FontWeight.SemiBold,    fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),
    labelMedium   = TextStyle(fontWeight = FontWeight.Medium,      fontSize = 12.sp, lineHeight = 18.sp, letterSpacing = 0.5.sp),
    labelSmall    = TextStyle(fontWeight = FontWeight.Medium,      fontSize = 11.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp),
)
