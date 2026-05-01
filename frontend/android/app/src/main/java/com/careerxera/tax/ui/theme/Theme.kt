package com.careerxera.tax.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// ── Brand Palette ──────────────────────────────────────────────────────────────
val Brand900  = Color(0xFF0F2460)
val Brand800  = Color(0xFF1A3578)  // deep navy
val Brand700  = Color(0xFF1E3A8A)  // primary
val Brand600  = Color(0xFF2563EB)
val Brand500  = Color(0xFF3B82F6)  // accent blue
val Brand400  = Color(0xFF60A5FA)
val Brand100  = Color(0xFFDBEAFE)
val Brand50   = Color(0xFFEFF6FF)

val GradientStart  = Color(0xFF1E3A8A)
val GradientMid    = Color(0xFF1D4ED8)
val GradientEnd    = Color(0xFF3B82F6)

val SurfaceDark    = Color(0xFF0F172A)
val SurfaceDark2   = Color(0xFF1E293B)
val SurfaceLight   = Color(0xFFF8FAFC)
val SurfaceLight2  = Color(0xFFFFFFFF)

val Success        = Color(0xFF22C55E)
val Error          = Color(0xFFEF4444)
val Warning        = Color(0xFFF59E0B)

// ── Light Color Scheme ─────────────────────────────────────────────────────────
private val LightColorScheme = lightColorScheme(
    primary          = Brand700,
    onPrimary        = Color.White,
    primaryContainer = Brand100,
    onPrimaryContainer = Brand900,
    secondary        = Brand500,
    onSecondary      = Color.White,
    secondaryContainer = Brand50,
    onSecondaryContainer = Brand800,
    background       = SurfaceLight,
    onBackground     = Color(0xFF0F172A),
    surface          = SurfaceLight2,
    onSurface        = Color(0xFF1E293B),
    surfaceVariant   = Color(0xFFF1F5F9),
    onSurfaceVariant = Color(0xFF64748B),
    error            = Error,
    onError          = Color.White,
    outline          = Color(0xFFCBD5E1),
)

// ── Dark Color Scheme ──────────────────────────────────────────────────────────
private val DarkColorScheme = darkColorScheme(
    primary          = Brand400,
    onPrimary        = Brand900,
    primaryContainer = Brand800,
    onPrimaryContainer = Brand100,
    secondary        = Brand400,
    onSecondary      = Brand900,
    secondaryContainer = Brand800,
    onSecondaryContainer = Brand100,
    background       = SurfaceDark,
    onBackground     = Color(0xFFF1F5F9),
    surface          = SurfaceDark2,
    onSurface        = Color(0xFFE2E8F0),
    surfaceVariant   = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFF94A3B8),
    error            = Color(0xFFFCA5A5),
    onError          = Color(0xFF7F1D1D),
    outline          = Color(0xFF334155),
)

@Composable
fun TaxAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography  = AppTypography,
        content     = content
    )
}
