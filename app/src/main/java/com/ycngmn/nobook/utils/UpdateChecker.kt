package com.ycngmn.nobook.utils

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

sealed interface UpdateResult {
    data class UpToDate(val latest: String) : UpdateResult
    data class Available(val latest: String, val url: String) : UpdateResult
    data object Failed : UpdateResult
}

private const val LATEST_RELEASE_API =
    "https://api.github.com/repos/dvadesetpet-glitch/NoBook/releases/latest"

/** Numeric parts of a version like "v1.50" or "1.5.2-beta" -> [1, 50] / [1, 5, 2]. */
private fun versionParts(v: String): List<Int> =
    Regex("\\d+").findAll(v.removePrefix("v")).map { it.value.toIntOrNull() ?: 0 }.toList()

private fun isNewer(latest: String, current: String): Boolean {
    val a = versionParts(latest)
    val b = versionParts(current)
    for (i in 0 until maxOf(a.size, b.size)) {
        val x = a.getOrElse(i) { 0 }
        val y = b.getOrElse(i) { 0 }
        if (x != y) return x > y
    }
    return false
}

/** Asks the GitHub API for the latest published release and compares it with [currentVersion]. */
suspend fun checkForUpdate(currentVersion: String): UpdateResult = withContext(Dispatchers.IO) {
    try {
        val conn = URL(LATEST_RELEASE_API).openConnection() as HttpURLConnection
        try {
            conn.connectTimeout = 8000
            conn.readTimeout = 8000
            conn.setRequestProperty("Accept", "application/vnd.github+json")
            if (conn.responseCode != 200) return@withContext UpdateResult.Failed
            val json = JSONObject(conn.inputStream.bufferedReader().use { it.readText() })
            val tag = json.getString("tag_name")
            val url = json.optString("html_url", "https://github.com/dvadesetpet-glitch/NoBook/releases/latest")
            if (isNewer(tag, currentVersion)) UpdateResult.Available(tag, url) else UpdateResult.UpToDate(tag)
        } finally {
            conn.disconnect()
        }
    } catch (e: Exception) {
        UpdateResult.Failed
    }
}
