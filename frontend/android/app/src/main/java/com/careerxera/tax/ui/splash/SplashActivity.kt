package com.careerxera.tax.ui.splash

import android.annotation.SuppressLint
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import com.careerxera.tax.MainActivity
import com.careerxera.tax.ui.onboarding.OnboardingActivity
import com.careerxera.tax.ui.theme.*
import kotlinx.coroutines.delay

@SuppressLint("CustomSplashScreen")
class SplashActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val prefs: SharedPreferences = getSharedPreferences("app_prefs", MODE_PRIVATE)
        val onboardingDone = prefs.getBoolean("onboarding_done", false)

        setContent {
            TaxAppTheme {
                SplashScreen {
                    val intent = if (onboardingDone) {
                        Intent(this, MainActivity::class.java)
                    } else {
                        Intent(this, OnboardingActivity::class.java)
                    }
                    startActivity(intent)
                    finish()
                }
            }
        }
    }
}

@Composable
fun SplashScreen(onFinished: () -> Unit) {

    // Animate logo scale: spring pop
    val scale = remember { Animatable(0.3f) }
    // Animate alpha: fade in
    val alpha = remember { Animatable(0f) }
    // Tagline alpha
    val tagAlpha = remember { Animatable(0f) }
    // Tagline slide
    val tagOffset = remember { Animatable(30f) }

    LaunchedEffect(Unit) {
        // Logo pop
        scale.animateTo(1f, animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium))
        alpha.animateTo(1f, animationSpec = tween(400))
        delay(300)
        // Tagline slide + fade
        tagAlpha.animateTo(1f, animationSpec = tween(500))
        tagOffset.animateTo(0f, animationSpec = tween(500, easing = EaseOutCubic))
        delay(1200)
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(Color(0xFF2563EB), Color(0xFF1E3A8A), Color(0xFF0F172A)),
                    center = Offset(0.5f * 1080f, 0.35f * 1920f),
                    radius = 900f
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // Glow circle behind logo
        Box(
            modifier = Modifier
                .size(200.dp)
                .scale(scale.value * 1.6f)
                .alpha(alpha.value * 0.15f)
                .background(
                    Brush.radialGradient(listOf(Color(0xFF60A5FA), Color.Transparent)),
                    shape = androidx.compose.foundation.shape.CircleShape
                )
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo mark — stylised "CX" monogram in a circle
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .scale(scale.value)
                    .alpha(alpha.value)
                    .background(
                        Brush.linearGradient(listOf(Color(0xFF60A5FA), Color(0xFF3B82F6))),
                        shape = androidx.compose.foundation.shape.CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "CX",
                    style = TextStyle(
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 38.sp,
                        color = Color.White,
                        shadow = Shadow(Color(0x441E3A8A), Offset(0f, 4f), 8f)
                    )
                )
            }

            Spacer(Modifier.height(20.dp))

            // App name
            Text(
                text = "CareerXera Tax",
                modifier = Modifier.alpha(alpha.value).scale(scale.value),
                style = TextStyle(
                    fontWeight = FontWeight.Bold,
                    fontSize = 28.sp,
                    color = Color.White,
                    letterSpacing = 0.5.sp,
                    shadow = Shadow(Color(0x661E3A8A), Offset(0f, 4f), 12f)
                )
            )

            Spacer(Modifier.height(8.dp))

            // Tagline
            Text(
                text = "Expert CA Services, Simplified",
                modifier = Modifier
                    .alpha(tagAlpha.value)
                    .offset(y = tagOffset.value.dp),
                style = TextStyle(
                    fontWeight = FontWeight.Normal,
                    fontSize = 14.sp,
                    color = Color(0xFFBFDBFE),
                    letterSpacing = 1.2.sp,
                    textAlign = TextAlign.Center
                )
            )
        }

        // Bottom brand line
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 40.dp)
                .alpha(tagAlpha.value)
        ) {
            Text(
                text = "Powered by CareerXera",
                style = TextStyle(
                    fontSize = 12.sp,
                    color = Color(0x99BFDBFE),
                    letterSpacing = 0.8.sp
                )
            )
        }
    }
}

// Custom easing
val EaseOutCubic = CubicBezierEasing(0.33f, 1f, 0.68f, 1f)
