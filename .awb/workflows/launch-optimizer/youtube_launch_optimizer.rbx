dsl = Agent.create(:youtube_launch_optimizer) do
  description 'This workflow optimizes video launch by analyzing, preparing, and generating content for various platforms.'

  prompts do
    prompt :short_title_prompt                , content: load_file("1-1-short-title.txt")
    prompt :video_summary_prompt              , content: load_file("1-1-summarize-video.txt")
    prompt :video_abridgement_prompt          , content: load_file("1-2-1-abridge-video.txt")
    prompt :abridgement_descrepencies_prompt  , content: load_file("1-3-abridge-video-descrepencies.txt")
    prompt :intro_outro_seperation_prompt     , content: load_file("1-4-seperate-intro-outro.txt")
    prompt :find_video_cta_prompt             , content: load_file("1-5-find-video-cta.txt")
    prompt :identify_chapters_prompt          , content: load_file("2-1-identify-chapters.txt")
    prompt :chapter_folder_names_prompt       , content: load_file("2-2-refine-chapters.txt")
    prompt :create_chapters_prompt            , content: load_file("2-3-create-chapters.txt")
    prompt :transcript_design_style_prompt    , content: load_file("3-1-transcript-design-style.txt") 
    prompt :intro_outro_design_ideas_prompt   , content: load_file("3-2-intro-outro-design-ideas.txt")
    prompt :editor_brief_prompt               , content: load_file("3-3-editor-brief.txt")
    prompt :transcript_design_ideas_prompt    , content: load_file("3-4-transcript-design-ideas.txt")
    prompt :analyze_content_essence_prompt    , content: load_file("4-1-analyze-content-essence.txt")
    prompt :analyze_audience_engagement_prompt, content: load_file("4-2-analyze-audience-engagement.txt")
    prompt :analyze_cta_competitors_prompt    , content: load_file("4-3-analyze-cta-competitors.txt")
    prompt :title_generation_prompt           , content: load_file("5-1-generate-title.txt")
    prompt :thumbnail_text_prompt             , content: load_file("5-2-generate-thumbnail-text.txt")
    prompt :thumbnail_text_csv_prompt         , content: load_file("5-3-generate-thumbnail-text-csv.txt")
    prompt :thumbnail_visual_elements_prompt  , content: load_file("5-4-thumbnail-visual-elements.txt")
    prompt :thumbnail_prompt                  , content: load_file("5-5-thumbnail.txt")
    prompt :yt_simple_description_prompt      , content: load_file("6-1-yt-simple-description.txt")
    prompt :yt_description_prompt             , content: load_file("6-2-yt-write-description.txt")
    prompt :yt_format_description_prompt      , content: load_file("6-3-yt-format-description.txt")
    prompt :yt_description_custom_gpt_prompt  , content: load_file("6-4-yt-description-custom-gpt.txt")
    prompt :yt_pinned_comment_prompt          , content: load_file("6-5-yt-pinned-comment.txt") 
    prompt :yt_metadata_prompt                , content: load_file("6-6-yt-meta-data.txt")
    prompt :tweet_prompt                      , content: load_file("7-1-create-tweet.txt")
    prompt :facebook_post_prompt              , content: load_file("7-2-create-fb-post.txt")
    prompt :linkedin_post_prompt              , content: load_file("7-3-create-linkedin-post.txt")
    prompt :add_to_video_list_prompt          , content: load_file("7-4-add-to-video-list.txt")
    prompt :shorts_context_prompt             , content: load_file("8-1-create-shorts-context.txt")
    prompt :shorts_title_prompt               , content: load_file("8-2-create-shorts-title.txt")
    prompt :shorts_description_prompt         , content: load_file("8-3-create-shorts-description.txt")
    prompt :shorts_tweet_prompt               , content: load_file("8-4-create-shorts-tweet.txt")

    prompt :outcome_notes_prompt              , content: load_file("99-1-outcome-notes.txt")
  end

  attributes do
    attribute :gpt_links, type: :string
    attribute :gpt_links2, type: :string
    attribute :project_code, type: :string
    attribute :project_folder, type: :string
    attribute :short_title, type: :string
    attribute :transcript, type: :string

    attribute :transcript_abridgement, type: :string
    attribute :transcript_abridgement_descrepencies, type: :array
    attribute :transcript_intro, type: :string
    attribute :transcript_outro, type: :string
    attribute :transcript_hook, type: :string
    attribute :transcript_recap, type: :string
    attribute :video_editor_instructions, type: :string
    attribute :intro_outro_design_ideas, type: :string
    attribute :design_style, type: :string
    attribute :design_ideas, type: :string
    attribute :editor_brief, type: :string
    attribute :srt, type: :string
    attribute :analyze_cta_competitors, type: :string
    attribute :video_title, type: :string
    attribute :video_link, type: :string
    attribute :video_link_playlist, type: :string
    attribute :video_topic_theme, type: :string
    attribute :video_related_links, type: :array
    attribute :video_keywords, type: :array
    attribute :important_statistics, type: :string
    attribute :video_description, type: :string
    attribute :video_simple_description, type: :string
    attribute :video_description_custom_gpt, type: :string
    attribute :video_pinned_comment, type: :string
    attribute :video_metadata, type: :string
    attribute :video_references, type: :string
    attribute :key_takeaways, type: :string
    attribute :content_highlights
    attribute :identify_chapters, type: :string
    attribute :chapter_folder_names, type: :string
    attribute :chapters, type: :string
    attribute :fold_cta, type: :string
    attribute :primary_cta, type: :string
    attribute :affiliate_cta, type: :array
    attribute :future_video_cta, type: :string
    attribute :past_video_cta, type: :string
    attribute :brand_info, type: :string
    attribute :title_ideas, type: :array
    attribute :thumbnail_text, type: :string
    attribute :thumbnail_text_csv, type: :string
    attribute :thumbnail_visual_elements, type: :string
    attribute :tweet_content, type: :string
    attribute :facebook_post, type: :string
    attribute :linkedin_post, type: :string
    attribute :shorts_context, type: :string
    attribute :shorts_title, type: :string
    attribute :shorts_description, type: :string
    attribute :outcome_notes, type: :string
  end

  section 'Video Preparation' do
    step 'Configure' do
      input :gpt_links
      input :gpt_links2
      input :project_code
      input :project_folder
      input :short_title
      input :video_title
      input :title_ideas
      input :video_link
      input :video_related_links
      input :video_keywords
      input :brand_info
      input :fold_cta
      input :primary_cta
      input :affiliate_cta
      input :chapters
      input :srt
      input :transcript
      input :transcript_abridgement
      input :transcript_summary
      input :transcript_intro
      input :transcript_hook, type: :string
      input :transcript_outro
      input :transcript_recap
      prompt :short_title_prompt
      output :project_code
      output :short_title
      output :title_ideas
    end

    step 'Script Summary' do
      input :transcript
      input :title_ideas
      input :project_code
      prompt :video_summary_prompt
      output :transcript_summary
    end

    step 'Script Abridgement' do
      input :transcript_summary
      input :transcript
      prompt :video_abridgement_prompt
      output :transcript_abridgement
    end

    step 'Abridge QA' do
      input :transcript
      input :transcript_abridgement
      prompt :abridgement_descrepencies_prompt
      output :transcript_abridgement_descrepencies
    end

    step 'Intro/Outro Seperation' do
      input :transcript
      input :transcript_intro
      input :transcript_outro
      prompt :intro_outro_seperation_prompt
      output :transcript_intro
      output :transcript_outro
    end

    step 'Find Video CTA' do
      input :transcript
      prompt :find_video_cta_prompt
      output :video_references
      output :future_video_cta, type: :string
      output :past_video_cta, type: :string
    end
  end


  section 'Build Chapters' do
    step 'Find Chapters' do
      input :transcript
      input :transcript_abridgement
      prompt :identify_chapters_prompt
      output :identify_chapters
    end

    step 'Refine Chapters' do
      input :identify_chapters
      input :chapter_folder_names
      input :transcript
      prompt :chapter_folder_names_prompt
      output :chapters
    end

    step 'Create Chapters' do
      input :chapters
      input :srt
      prompt :create_chapters_prompt
      output :chapters
    end
  end

  section 'B-Roll Suggestions' do
    step 'Design Style List' do
      input :transcript
      prompt :transcript_design_style_prompt
      output :design_style
    end

    step 'Intro/Outro B-Roll' do
      input :transcript_intro
      input :transcript_outro
      input :design_style
      prompt :intro_outro_design_ideas_prompt
      output :intro_outro_design_ideas
    end

    step 'Brief for Video Editor' do
      input :video_editor_instructions
      input :intro_outro_design_ideas
      input :chapters
      input :future_video_cta
      input :past_video_cta
      prompt :editor_brief_prompt
      output :editor_brief
    end

    step 'Transcript Design Ideas' do
      input :transcript
      input :design_style
      prompt :transcript_design_ideas_prompt
      output :design_ideas
    end
  end

  section 'Content Analysis' do
    step 'Content Essence' do
      input :transcript_abridgement
      input :video_topic_theme        # (Main Topic or Theme)
      input :video_keywords
      input :important_statistics
      input :content_highlights       # (Keywords/Insites/Takeaways/Audience-Related Insights)
      prompt :analyze_content_essence_prompt
      output :video_topic_theme        # (Main Topic or Theme)
      output :video_keywords
      output :important_statistics
      output :content_highlights       # (Keywords/Insites/Takeaways/Audience-Related Insights)
    end

    step 'Audience Engagement' do
      input :transcript_abridgement
      input :emotional_trigger_tone
      input :overal_tone_style
      input :audience_insights
      input :usp
      prompt :analyze_audience_engagement_prompt
      output :emotional_trigger_tone
      output :overal_tone_style
      output :audience_insights
      output :usp
    end

    step 'CTA/Competitors' do
      input :transcript_abridgement
      input :cta_phrases
      input :catchy_phrases
      input :questions_posed_or_answered
      input :competitor_search_terms
      prompt :analyze_cta_competitors_prompt
      output :cta_phrases
      output :catchy_phrases
      output :questions_posed_or_answered
      output :competitor_search_terms
    end
  end

  section 'Rony' do
    step 'Step 1' do
      input :first_name
      input :last_name
      prompt :content_highlights
      output :full_name
    end
    step 'Step 2' do
      input :company
      prompt :content_highlights
    end
  end


  section 'Title & Thumbnail' do
    step 'Title Ideas' do
      input :short_title              #
      input :video_topic_theme        # (Main Topic or Theme)
      input :content_highlights       # (Keywords/Insites/Takeaways/Audience-Related Insights)
      prompt :title_generation_prompt
      output :title_ideas
    end

    # Analyze Title Short List
    # Here are the types of prompts or questions you've been writing:

    # Title Analysis: Requesting evaluations of YouTube titles.
    # Title Suggestions: Asking for new or varied title options.
    # Title Optimization: Seeking ways to improve existing titles.
    # Comparative Analysis: Comparing and analyzing different title versions.
    # Content Strategy: Discussing factors influencing YouTube CTR.
    # Instructional Requests: Asking for concise, actionable recommendations.
    # These types cover the main focus areas of your queries related to optimizing and refining YouTube content titles.

    step 'Thumb Text Ideas' do
      input :video_title
      input :video_topic_theme
      input :content_highlights
      input :title_ideas
      prompt :thumbnail_text_prompt
      output :thumbnail_text
    end

    step 'Thumb Text CSV' do
      input :thumbnail_text
      prompt :thumbnail_text_csv_prompt
      output :thumbnail_text_csv
    end

    step 'THUMB THUMB THUMB' do
      # https://websim.ai/@wonderwhy_er/youtube-thumbnail-brainstormer
    end

    step 'Visual Element Ideas' do
      input :video_title
      input :content_highlights
      input :title_ideas
      prompt :thumbnail_visual_elements_prompt
      output :thumbnail_visual_elements
    end

    step 'Create Thumbnail' do
      input :video_title
      input :thumbnail_text
      input :transcript_abridgement
      prompt :thumbnail_prompt
      output :thumbnail_image
    end

  end

  section 'YouTube Meta Data' do
    step 'Simple Description' do
      input :video_title
      input :video_keywords
      input :transcript_abridgement
      prompt :yt_simple_description_prompt
      output :video_simple_description
    end

    step 'Write Description' do
      input :video_title
      input :chapters
      input :video_simple_description
      input :brand_info
      input :fold_cta
      input :primary_cta
      input :affiliate_cta
      input :video_related_links
      input :video_keywords
      prompt :yt_description_prompt
      output :video_description
    end

    step 'Format Description' do
      input :video_description
      prompt :yt_format_description_prompt
      output :video_description
    end

    step 'Custom GPT Description' do
      input :video_title
      input :chapters
      input :transcript_abridgement
      input :brand_info
      input :fold_cta
      input :primary_cta
      input :affiliate_cta
      input :video_related_links
      input :video_keywords
      prompt :yt_description_custom_gpt_prompt
      output :video_description_custom_gpt
    end

    step 'Pinned Comment' do
      # I don't need all these, but not sure which ones I do need yet
      input :video_title
      input :transcript_abridgement
      input :chapters
      input :brand_info
      input :fold_cta
      input :primary_cta
      input :affiliate_cta
      input :video_related_links
      input :video_keywords
      input :video_description
      prompt :yt_pinned_comment_prompt
      output :video_pinned_comment
    end

    step 'Extra Metadata' do
      input :video_title
      input :transcript_abridgement
      prompt :yt_metadata_prompt
      output :video_metadata
    end
  end

  section 'Social Media Posts' do
    step 'Create Tweet' do
      input :video_title
      input :video_link
      input :video_link_playlist
      input :video_keywords
      input :transcript_summary
      prompt :tweet_prompt
      output :tweet_content
    end

    step 'Create FB Post' do
      input :transcript_summary
      input :video_keywords
      prompt :facebook_post_prompt
      output :facebook_post
    end

    step 'Create LinkedIn Post' do
      input :video_title
      input :video_link
      input :video_link_playlist
      input :video_keywords
      input :transcript_abridgement
      prompt :linkedin_post_prompt
      output :linkedin_post
    end

    # b09-synthesize-chat-confo
    # How to Create Structured Docs from AI Chats FAST
    # https://youtu.be/l86EwdhS4hY

    step 'Add To Video List' do
      input :project_folder
      input :video_title
      input :video_link
      input :video_link_playlist
      prompt :add_to_video_list_prompt
      output :video_references
    end
  end

  section 'YouTube Shorts' do
    step 'Create Shorts Title' do
      input :short_transcription
      prompt :shorts_title_prompt
      output :shorts_title      
    end

    step 'Create Shorts Description' do
      input :shorts_title
      input :short_transcription
      input :shorts_video_link
      input :shorts_video_keywords
      prompt :shorts_description_prompt
      output :shorts_description
    end

    step 'Create Tweet' do
      input :shorts_title
      input :short_transcription
      input :shorts_video_link
      input :shorts_video_keywords
      prompt :shorts_tweet_prompt
      output :shorts_tweet
    end
  end
end

file = '/Users/davidcruwys/dev/ad/agent-workflow-builder/gpt-agents/src/content/gpt-workflows/youtube-launch-optimizer.json'
dsl
  .save
  .save_json(file)
