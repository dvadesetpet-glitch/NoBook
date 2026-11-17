package com.ycngmn.nobook.utils

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.content.pm.verify.domain.DomainVerificationManager
import android.content.pm.verify.domain.DomainVerificationUserState
import android.net.Uri
import android.os.Build

/** Who opens a Facebook link when it is tapped outside Nobook. */
sealed interface LinkHandler {
    /** Nobook opens it. */
    data object Nobook : LinkHandler
    /** No app claims the link, so the default browser gets it (e.g. Chrome). */
    data class Browser(val label: String) : LinkHandler
    /** Another app (e.g. the official Facebook app) has taken the links. */
    data class OtherApp(val label: String, val packageName: String) : LinkHandler
    /** Android asks every time (several apps, no default chosen). */
    data object Chooser : LinkHandler
    data object Unknown : LinkHandler
}

private const val PROBE_HOST = "m.facebook.com"

// Apps that can claim facebook.com links. Declared in the manifest's <queries> so they are visible.
// stella / appmanager are Facebook's system components that often hold the verified claim.
private val FACEBOOK_APPS = listOf(
    "com.facebook.katana", "com.facebook.lite", "com.facebook.stella", "com.facebook.appmanager"
)

private fun PackageManager.labelOf(info: ResolveInfo): String =
    runCatching { info.loadLabel(this).toString() }.getOrDefault(info.activityInfo.packageName)

private fun PackageManager.labelOf(packageName: String): String =
    runCatching { getApplicationInfo(packageName, 0).loadLabel(this).toString() }.getOrDefault(packageName)

/** The user's default browser, which gets every link that no app has claimed. */
private fun defaultBrowserLabel(context: Context): String {
    val intent = Intent.makeMainSelectorActivity(Intent.ACTION_MAIN, Intent.CATEGORY_APP_BROWSER)
    val pm = context.packageManager
    val info = runCatching { pm.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY) }.getOrNull()
        ?: runCatching { pm.resolveActivity(intent, 0) }.getOrNull()
    return if (info != null && info.activityInfo.packageName != "android") context.packageManager.labelOf(info)
    else "your browser"
}

/**
 * Whether [packageName] gets [PROBE_HOST] links: 2 = verified by the site, 1 = enabled by the user,
 * 0 = neither, -1 = the app's "Open supported links" switch is off, null = not installed / unknown.
 */
private fun domainState(context: Context, packageName: String): Int? {
    val manager = context.getSystemService(DomainVerificationManager::class.java) ?: return null
    // A disabled app is never offered a link, even though Android keeps its old verified state.
    val enabled = runCatching { context.packageManager.getApplicationInfo(packageName, 0).enabled }.getOrNull()
    if (enabled != true) return null
    val state = runCatching { manager.getDomainVerificationUserState(packageName) }.getOrNull() ?: return null
    if (!state.isLinkHandlingAllowed) return -1
    return when (state.hostToStateMap[PROBE_HOST]) {
        DomainVerificationUserState.DOMAIN_STATE_VERIFIED -> 2
        DomainVerificationUserState.DOMAIN_STATE_SELECTED -> 1
        else -> 0
    }
}

/**
 * Android 12+ decides per domain: an app gets a link if the site verified it, or the user enabled
 * it under "Open by default". A verified app (the official Facebook app) wins over a merely
 * enabled one. Without a winner the link goes to the default browser.
 */
fun detectLinkHandler(context: Context): LinkHandler {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return detectLegacy(context)

    val pm = context.packageManager
    val mine = domainState(context, context.packageName) ?: return LinkHandler.Unknown
    val others = FACEBOOK_APPS.mapNotNull { pkg -> domainState(context, pkg)?.let { pkg to it } }

    // Verified beats user-enabled: a verified Facebook app wins even if Nobook is enabled too.
    others.firstOrNull { it.second == 2 }?.let { return LinkHandler.OtherApp(pm.labelOf(it.first), it.first) }
    if (mine >= 1) return LinkHandler.Nobook
    others.firstOrNull { it.second == 1 }?.let { return LinkHandler.OtherApp(pm.labelOf(it.first), it.first) }
    return LinkHandler.Browser(defaultBrowserLabel(context))
}

/** Android 11 and older: ask the package manager who the default for the link is. */
private fun detectLegacy(context: Context): LinkHandler {
    val pm = context.packageManager
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://$PROBE_HOST/")).addCategory(Intent.CATEGORY_BROWSABLE)
    val info = runCatching { pm.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY) }.getOrNull()
        ?: return LinkHandler.Unknown
    val pkg = info.activityInfo.packageName
    return when {
        pkg == context.packageName -> LinkHandler.Nobook
        pkg == "android" -> LinkHandler.Chooser
        pkg in FACEBOOK_APPS -> LinkHandler.OtherApp(pm.labelOf(info), pkg)
        else -> LinkHandler.Browser(pm.labelOf(info))
    }
}

fun LinkHandler.describe(): String = when (this) {
    LinkHandler.Nobook -> "Facebook links open in Nobook"
    is LinkHandler.Browser -> "Facebook links open in $label, not Nobook"
    is LinkHandler.OtherApp -> "Facebook links are taken by $label, not Nobook"
    LinkHandler.Chooser -> "Android asks which app to use each time"
    LinkHandler.Unknown -> "Could not tell which app opens Facebook links"
}
