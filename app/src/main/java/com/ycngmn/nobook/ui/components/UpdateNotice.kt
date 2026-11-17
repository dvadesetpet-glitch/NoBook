package com.ycngmn.nobook.ui.components

import android.content.Context
import android.content.Intent
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.core.net.toUri
import com.ycngmn.nobook.BuildConfig
import com.ycngmn.nobook.utils.UpdateResult
import com.ycngmn.nobook.utils.checkForUpdate

private const val PREFS = "nobook_update"
private const val KEY_DISMISSED = "dismissed_version"
private const val KEY_LOGO_TIP = "logo_tip_shown"

/**
 * Checks GitHub for a newer release once, when the app starts, and offers it in a dialog.
 * "Later" remembers that version, so the same release is not offered again on every start;
 * a newer one is. Network errors are ignored: Settings > Check updates reports those.
 */
@Composable
fun UpdateNotice() {
    val context = LocalContext.current
    var available by remember { mutableStateOf<UpdateResult.Available?>(null) }

    LaunchedEffect(Unit) {
        val result = checkForUpdate(BuildConfig.VERSION_NAME) as? UpdateResult.Available ?: return@LaunchedEffect
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (prefs.getString(KEY_DISMISSED, null) != result.latest) available = result
    }

    // One-time hint after installing a version that moved the settings from the "+" button to the logo.
    var showTip by remember {
        mutableStateOf(!context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_LOGO_TIP, false))
    }
    if (showTip) {
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Nobook settings") },
            text = { Text("Nobook settings are now opened by tapping the noBook logo in the top left corner.") },
            confirmButton = {
                TextButton(onClick = {
                    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                        .edit().putBoolean(KEY_LOGO_TIP, true).apply()
                    showTip = false
                }) { Text("OK") }
            },
        )
        return // the update dialog, if any, follows once this one is closed
    }

    val update = available ?: return
    val dismiss = {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_DISMISSED, update.latest).apply()
        available = null
    }

    AlertDialog(
        onDismissRequest = dismiss,
        title = { Text("Update available") },
        text = { Text("Nobook ${update.latest.removePrefix("v")} is available. You have ${BuildConfig.VERSION_NAME}.") },
        confirmButton = {
            TextButton(onClick = {
                runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, update.url.toUri())) }
                available = null
            }) { Text("Download") }
        },
        dismissButton = { TextButton(onClick = dismiss) { Text("Later") } },
    )
}
