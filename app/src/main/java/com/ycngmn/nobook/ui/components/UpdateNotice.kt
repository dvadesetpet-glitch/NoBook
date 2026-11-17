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
