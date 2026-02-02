/**
 * analyze Edge Function
 * Sends crawled file metadata to GPT-4 for categorized 5S suggestions.
 * Runs deterministic pre-filtering first, then AI analysis.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { analyzeFiles, ANALYSIS_SYSTEM_PROMPT } from '../_shared/openai.ts';

const BATCH_SIZE = 500;
const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;
const FOUR_YEARS_MS = 4 * 365.25 * 24 * 60 * 60 * 1000;

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { userId } = await verifyAuth(req);
    const { scan_id } = await req.json();

    if (!scan_id) {
      return new Response(
        JSON.stringify({ error: 'scan_id is required' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const admin = getAdminClient();

    // Verify scan belongs to user and is crawled
    const { data: scan, error: scanErr } = await admin
      .from('scans')
      .select('*')
      .eq('id', scan_id)
      .eq('user_id', userId)
      .single();

    if (scanErr || !scan) {
      return new Response(
        JSON.stringify({ error: 'Scan not found' }),
        { status: 404, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (scan.status !== 'crawled') {
      return new Response(
        JSON.stringify({ error: `Scan is not ready for analysis. Current status: ${scan.status}` }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Set status to analyzing
    await admin.from('scans').update({ status: 'analyzing', updated_at: new Date().toISOString() }).eq('id', scan_id);

    // Fetch all crawled files
    const { data: files, error: filesErr } = await admin
      .from('crawled_files')
      .select('*')
      .eq('scan_id', scan_id);

    if (filesErr) throw filesErr;

    const now = Date.now();
    const suggestions: any[] = [];

    // ─── Phase 1: Deterministic Pre-filtering ───

    for (const file of files) {
      if (file.is_folder) continue;

      // Zero-byte files
      if (file.size_bytes === 0) {
        suggestions.push({
          scan_id,
          file_id: file.id,
          category: 'delete',
          severity: 'high',
          title: 'Empty file',
          description: `This file is 0 bytes. It may be a failed upload or an accidentally created empty file.`,
          current_value: file.path,
          suggested_value: null,
          confidence: 0.95,
        });
      }

      // Temp files
      const tempPatterns = [/^~\$/, /\.tmp$/i, /^Thumbs\.db$/i, /^\.DS_Store$/i, /^desktop\.ini$/i];
      if (tempPatterns.some(p => p.test(file.name))) {
        suggestions.push({
          scan_id,
          file_id: file.id,
          category: 'delete',
          severity: 'critical',
          title: 'Temporary file',
          description: `System/temporary file that should not be in a document library.`,
          current_value: file.path,
          suggested_value: null,
          confidence: 1.0,
        });
      }

      // Very old files (>4 years)
      if (file.modified_at_sp) {
        const age = now - new Date(file.modified_at_sp).getTime();
        if (age > FOUR_YEARS_MS) {
          suggestions.push({
            scan_id,
            file_id: file.id,
            category: 'delete',
            severity: 'medium',
            title: 'Very old file',
            description: `Not modified since ${new Date(file.modified_at_sp).toLocaleDateString()}. Consider whether this is still needed.`,
            current_value: file.path,
            suggested_value: null,
            confidence: 0.6,
          });
        } else if (age > TWO_YEARS_MS) {
          suggestions.push({
            scan_id,
            file_id: file.id,
            category: 'archive',
            severity: 'medium',
            title: 'Stale file',
            description: `Not modified since ${new Date(file.modified_at_sp).toLocaleDateString()}. Consider archiving to cold storage.`,
            current_value: file.path,
            suggested_value: null,
            confidence: 0.65,
          });
        }
      }
    }

    // Duplicate detection (same name + same size in different locations)
    const filesByNameSize = new Map<string, any[]>();
    for (const file of files) {
      if (file.is_folder) continue;
      const key = `${file.name.toLowerCase()}::${file.size_bytes}`;
      if (!filesByNameSize.has(key)) filesByNameSize.set(key, []);
      filesByNameSize.get(key)!.push(file);
    }

    for (const [, dupes] of filesByNameSize) {
      if (dupes.length < 2) continue;
      // Keep the most recently modified one, flag others
      dupes.sort((a: any, b: any) =>
        new Date(b.modified_at_sp || 0).getTime() - new Date(a.modified_at_sp || 0).getTime()
      );

      for (let i = 1; i < dupes.length; i++) {
        suggestions.push({
          scan_id,
          file_id: dupes[i].id,
          category: 'delete',
          severity: 'high',
          title: 'Duplicate file',
          description: `This file appears to be a duplicate of "${dupes[0].path}" (same name and size). The copy at "${dupes[0].path}" was more recently modified.`,
          current_value: dupes[i].path,
          suggested_value: null,
          confidence: 0.85,
        });
      }
    }

    // Deep folder detection
    for (const file of files) {
      if (!file.is_folder) continue;
      if (file.depth > 4) {
        suggestions.push({
          scan_id,
          file_id: file.id,
          category: 'structure',
          severity: 'high',
          title: 'Deeply nested folder',
          description: `This folder is ${file.depth} levels deep. Consider flattening the folder structure for easier navigation.`,
          current_value: file.path,
          suggested_value: null,
          confidence: 0.8,
        });
      }
    }

    // ─── Phase 2: AI Analysis ───

    // Group files by top-level folder for chunked analysis
    const filesByTopFolder = new Map<string, any[]>();
    for (const file of files) {
      const topFolder = file.path.split('/').filter(Boolean)[0] || 'root';
      if (!filesByTopFolder.has(topFolder)) filesByTopFolder.set(topFolder, []);
      filesByTopFolder.get(topFolder)!.push(file);
    }

    // Process each chunk
    const chunks: any[][] = [];
    let currentChunk: any[] = [];

    for (const [folder, folderFiles] of filesByTopFolder) {
      if (currentChunk.length + folderFiles.length > BATCH_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
      currentChunk.push(...folderFiles.map(f => ({
        path: f.path,
        name: f.name,
        extension: f.file_extension,
        size: f.size_bytes,
        is_folder: f.is_folder,
        depth: f.depth,
        created: f.created_at_sp,
        modified: f.modified_at_sp,
        created_by: f.created_by,
        modified_by: f.modified_by,
      })));
    }

    if (currentChunk.length > 0) chunks.push(currentChunk);

    // Run AI on each chunk
    for (const chunk of chunks) {
      try {
        const aiSuggestions = await analyzeFiles(
          {
            total_files: files.filter(f => !f.is_folder).length,
            total_folders: files.filter(f => f.is_folder).length,
            files: chunk,
          },
          ANALYSIS_SYSTEM_PROMPT
        );

        for (const s of aiSuggestions) {
          // Match file_path to a crawled_file
          const matchedFile = files.find(f => f.path === s.file_path);
          suggestions.push({
            scan_id,
            file_id: matchedFile?.id || null,
            category: s.category,
            severity: s.severity,
            title: s.title,
            description: s.description,
            current_value: s.file_path,
            suggested_value: s.suggested_value,
            confidence: s.confidence,
          });
        }
      } catch (aiErr) {
        console.error('AI analysis error for chunk:', aiErr);
        // Continue with other chunks
      }
    }

    // ─── Phase 3: Deduplicate and Store ───

    // Remove duplicate suggestions (same file + same category)
    const seen = new Set<string>();
    const uniqueSuggestions = suggestions.filter(s => {
      const key = `${s.file_id || s.current_value}::${s.category}::${s.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Batch insert suggestions
    if (uniqueSuggestions.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < uniqueSuggestions.length; i += batchSize) {
        const batch = uniqueSuggestions.slice(i, i + batchSize);
        const { error: insertErr } = await admin.from('suggestions').insert(batch);
        if (insertErr) console.error('Suggestion insert error:', insertErr);
      }
    }

    // Update scan status
    await admin.from('scans').update({
      status: 'complete',
      updated_at: new Date().toISOString(),
    }).eq('id', scan_id);

    // Category counts
    const categories = { delete: 0, archive: 0, rename: 0, structure: 0 };
    uniqueSuggestions.forEach(s => { categories[s.category as keyof typeof categories]++; });

    return new Response(
      JSON.stringify({ suggestion_count: uniqueSuggestions.length, categories }),
      { status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('analyze error:', err);

    // Try to update scan status to error
    try {
      const admin = getAdminClient();
      const { scan_id } = await req.json().catch(() => ({}));
      if (scan_id) {
        await admin.from('scans').update({
          status: 'error',
          error_message: err.message,
        }).eq('id', scan_id);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
