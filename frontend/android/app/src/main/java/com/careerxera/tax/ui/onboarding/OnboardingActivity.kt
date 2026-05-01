package com.careerxera.tax.ui.onboarding

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.*
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.*
import androidx.core.view.WindowCompat
import com.careerxera.tax.MainActivity
import com.careerxera.tax.ui.theme.*
import kotlinx.coroutines.launch

data class OnboardingPage(
    val title: String,
    val subtitle: String,
    val gradient: List<Color>,
    val illustrationTag: String
)

val pages = listOf(
    OnboardingPage(
        title = "All Your CA Services\nIn One Place",
        subtitle = "GST filing, ITR, company registration, and 50+ services — managed seamlessly from your pocket.",
        gradient = listOf(Color(0xFF1E3A8A), Color(0xFF1D4ED8), Color(0xFF2563EB)),
        illustrationTag = "dashboard"
    ),
    OnboardingPage(
        title = "Assigned CA,\nAlways By Your Side",
        subtitle = "Get a dedicated Chartered Accountant assigned to your application with real-time chat support.",
        gradient = listOf(Color(0xFF064E3B), Color(0xFF065F46), Color(0xFF059669)),
        illustrationTag = "ca"
    ),
    OnboardingPage(
        title = "Track Everything,\nMiss Nothing",
        subtitle = "Real-time status updates, document uploads, and timeline tracking — all in one dashboard.",
        gradient = listOf(Color(0xFF4C1D95), Color(0xFF5B21B6), Color(0xFF7C3AED)),
        illustrationTag = "track"
    ),
    OnboardingPage(
        title = "Secure, Fast &\nAlways Available",
        subtitle = "Bank-grade security, instant notifications, and 24/7 access to your financial services.",
        gradient = listOf(Color(0xFF7C2D12), Color(0xFF9A3412), Color(0xFFEA580C)),
        illustrationTag = "secure"
    ),
)

class OnboardingActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContent {
            TaxAppTheme {
                OnboardingScreen {
                    // Mark onboarding done
                    val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
                    prefs.edit().putBoolean("onboarding_done", true).apply()
                    startActivity(Intent(this, MainActivity::class.java))
                    finish()
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(onGetStarted: () -> Unit) {
    val pagerState = rememberPagerState { pages.size }
    val scope = rememberCoroutineScope()

    Box(Modifier.fillMaxSize()) {
        HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { page ->
            OnboardingPageContent(page = pages[page], pageIndex = page, pagerOffset = (pagerState.currentPage - page) + pagerState.currentPageOffsetFraction)
        }

        // Top: Skip button
        val isLast = pagerState.currentPage == pages.size - 1
        AnimatedVisibility(
            visible = !isLast,
            modifier = Modifier.align(Alignment.TopEnd).padding(top = 52.dp, end = 24.dp),
            enter = fadeIn(), exit = fadeOut()
        ) {
            TextButton(onClick = onGetStarted) {
                Text("Skip", style = MaterialTheme.typography.labelLarge, color = Color.White.copy(alpha = 0.7f))
            }
        }

        // Bottom controls
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 52.dp, start = 32.dp, end = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Dot indicators
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                pages.indices.forEach { i ->
                    val isSelected = pagerState.currentPage == i
                    val width by animateDpAsState(if (isSelected) 28.dp else 8.dp, animationSpec = spring(stiffness = Spring.StiffnessMediumLow), label = "dot_width")
                    Box(
                        modifier = Modifier
                            .height(8.dp)
                            .width(width)
                            .clip(CircleShape)
                            .background(if (isSelected) Color.White else Color.White.copy(0.35f))
                    )
                }
            }

            Spacer(Modifier.height(36.dp))

            // Next / Get Started button
            val btnText = if (isLast) "Get Started" else "Next"
            Button(
                onClick = {
                    if (isLast) onGetStarted()
                    else scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = pages[pagerState.currentPage].gradient[0]
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
            ) {
                Text(
                    text = btnText,
                    style = MaterialTheme.typography.labelLarge.copy(fontSize = 16.sp, fontWeight = FontWeight.Bold)
                )
            }
        }
    }
}

@Composable
fun OnboardingPageContent(page: OnboardingPage, pageIndex: Int, pagerOffset: Float) {
    // Parallax multiplier — illustration moves slightly slower than text
    val parallaxFactor = 0.3f

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(page.gradient))
    ) {
        // Background decorative circles
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawDecorativeCircles(size.width, size.height, page.gradient)
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp)
                .offset(x = (-pagerOffset * parallaxFactor * 60).dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.fillMaxHeight(0.08f))

            // Illustration area
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                OnboardingIllustration(tag = page.illustrationTag, gradient = page.gradient)
            }

            Spacer(Modifier.height(24.dp))

            // Title
            Text(
                text = page.title,
                style = MaterialTheme.typography.displayMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    textAlign = TextAlign.Center,
                    shadow = Shadow(Color(0x44000000), Offset(0f, 4f), 12f)
                )
            )

            Spacer(Modifier.height(16.dp))

            // Subtitle
            Text(
                text = page.subtitle,
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = Color.White.copy(alpha = 0.82f),
                    textAlign = TextAlign.Center,
                    lineHeight = 26.sp
                )
            )
        }
    }
}

fun DrawScope.drawDecorativeCircles(w: Float, h: Float, gradient: List<Color>) {
    val light = gradient.lastOrNull() ?: Color.White
    // Top-right circle
    drawCircle(light.copy(0.12f), radius = w * 0.55f, center = Offset(w * 1.1f, h * 0.05f))
    // Bottom-left circle
    drawCircle(light.copy(0.08f), radius = w * 0.45f, center = Offset(-w * 0.15f, h * 0.88f))
    // Small accent
    drawCircle(Color.White.copy(0.06f), radius = w * 0.22f, center = Offset(w * 0.15f, h * 0.25f))
}

@Composable
fun OnboardingIllustration(tag: String, gradient: List<Color>) {
    val light = gradient.lastOrNull() ?: Brand500
    val dark  = gradient.firstOrNull() ?: Brand700

    Box(
        modifier = Modifier
            .size(240.dp)
            .background(Color.White.copy(0.12f), RoundedCornerShape(36.dp))
            .border(2.dp, Color.White.copy(0.18f), RoundedCornerShape(36.dp)),
        contentAlignment = Alignment.Center
    ) {
        when (tag) {
            "dashboard" -> DashboardIllustration(light, dark)
            "ca"        -> CAIllustration(light, dark)
            "track"     -> TrackIllustration(light, dark)
            "secure"    -> SecureIllustration(light, dark)
        }
    }
}

@Composable
fun DashboardIllustration(light: Color, dark: Color) {
    Canvas(modifier = Modifier.size(180.dp)) {
        val w = size.width; val h = size.height
        // Phone frame
        drawRoundRect(Color.White.copy(0.9f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(16f), size = androidx.compose.ui.geometry.Size(w * 0.6f, h * 0.8f), topLeft = Offset(w * 0.2f, h * 0.1f))
        // Cards inside phone
        val cardColors = listOf(light.copy(0.85f), light.copy(0.6f), light.copy(0.4f))
        cardColors.forEachIndexed { i, c ->
            drawRoundRect(c, cornerRadius = androidx.compose.ui.geometry.CornerRadius(8f), size = androidx.compose.ui.geometry.Size(w * 0.44f, h * 0.12f), topLeft = Offset(w * 0.28f, h * 0.18f + i * (h * 0.16f)))
        }
        // Stat bar
        drawRoundRect(Color.White.copy(0.95f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(8f), size = androidx.compose.ui.geometry.Size(w * 0.44f, h * 0.08f), topLeft = Offset(w * 0.28f, h * 0.66f))
        // Bar fill
        drawRoundRect(light, cornerRadius = androidx.compose.ui.geometry.CornerRadius(8f), size = androidx.compose.ui.geometry.Size(w * 0.28f, h * 0.08f), topLeft = Offset(w * 0.28f, h * 0.66f))
    }
}

@Composable
fun CAIllustration(light: Color, dark: Color) {
    Canvas(modifier = Modifier.size(180.dp)) {
        val w = size.width; val h = size.height
        // Person circle
        drawCircle(Color.White.copy(0.95f), radius = w * 0.22f, center = Offset(w * 0.5f, h * 0.32f))
        drawCircle(light.copy(0.7f), radius = w * 0.14f, center = Offset(w * 0.5f, h * 0.32f))
        // Body
        val bodyPath = Path().apply {
            moveTo(w * 0.2f, h * 0.85f)
            cubicTo(w * 0.2f, h * 0.58f, w * 0.8f, h * 0.58f, w * 0.8f, h * 0.85f)
            close()
        }
        drawPath(bodyPath, Color.White.copy(0.85f))
        // Chat bubble
        drawRoundRect(light.copy(0.85f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(12f), size = androidx.compose.ui.geometry.Size(w * 0.38f, h * 0.18f), topLeft = Offset(w * 0.5f, h * 0.16f))
        drawCircle(light.copy(0.85f), radius = 6f, center = Offset(w * 0.48f, h * 0.36f))
    }
}

@Composable
fun TrackIllustration(light: Color, dark: Color) {
    Canvas(modifier = Modifier.size(180.dp)) {
        val w = size.width; val h = size.height
        // Timeline line
        drawLine(Color.White.copy(0.5f), Offset(w * 0.3f, h * 0.15f), Offset(w * 0.3f, h * 0.85f), strokeWidth = 3f)
        // Steps
        val stepColors = listOf(Color.White, light.copy(0.8f), light.copy(0.5f), Color.White.copy(0.4f))
        stepColors.forEachIndexed { i, c ->
            val y = h * 0.2f + i * h * 0.2f
            drawCircle(c, radius = if (i == 0) 14f else 10f, center = Offset(w * 0.3f, y))
            drawRoundRect(c.copy(0.7f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(8f), size = androidx.compose.ui.geometry.Size(w * 0.45f, h * 0.1f), topLeft = Offset(w * 0.42f, y - h * 0.05f))
        }
    }
}

@Composable
fun SecureIllustration(light: Color, dark: Color) {
    Canvas(modifier = Modifier.size(180.dp)) {
        val w = size.width; val h = size.height
        // Shield
        val shield = Path().apply {
            moveTo(w * 0.5f, h * 0.12f)
            lineTo(w * 0.78f, h * 0.25f)
            lineTo(w * 0.78f, h * 0.55f)
            cubicTo(w * 0.78f, h * 0.72f, w * 0.5f, h * 0.88f, w * 0.5f, h * 0.88f)
            cubicTo(w * 0.5f, h * 0.88f, w * 0.22f, h * 0.72f, w * 0.22f, h * 0.55f)
            lineTo(w * 0.22f, h * 0.25f)
            close()
        }
        drawPath(shield, Color.White.copy(0.85f))
        // Checkmark inside shield
        val check = Path().apply {
            moveTo(w * 0.38f, h * 0.5f)
            lineTo(w * 0.46f, h * 0.59f)
            lineTo(w * 0.62f, h * 0.42f)
        }
        drawPath(check, light, style = androidx.compose.ui.graphics.drawscope.Stroke(width = 6f, cap = StrokeCap.Round, join = StrokeJoin.Round))
    }
}
