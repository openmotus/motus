start_time = Time.now

dsl = Agent.create(:youtube_livestream_podcast_brief) do
  description 'This workflow transforms YouTube live stream transcripts into structured podcast briefs.'
  
  settings do
    prompt_path Ad::AgentArchitecture.gem_relative_file('prompts/youtube/livestream_podcast_brief')
    default_llm :gpt4o
  end

  prompts do
    prompt :configure_prompt                                , content: load_file("00-1-configure.txt")

    # Transcript Processing
    prompt :transcript_processor_prompt                     , content: load_file("01-1-abridge-video.txt")
    prompt :transcript_summary_prompt                       , content: load_file("01-2-transcript-summary.txt")
    prompt :transcript_abridgement_prompt                   , content: load_file("01-3-transcript-abridgement.txt")
    prompt :transcript_abridgement_descrepencies_prompt     , content: load_file("01-4-transcript-abridgement-descrepencies.txt")
    prompt :transcript_intro_prompt                         , content: load_file("01-5-transcript-intro.txt")
    prompt :transcript_outro_prompt                         , content: load_file("01-6-transcript-outro.txt")

    # Transcript Analysis
    prompt :analyze_engagement_triggers_prompt              , content: load_file("02-1-analyze-engagement-triggers.txt")
    prompt :analyze_audience_engagement_prompt              , content: load_file("02-2-analyze-audience-engagement.txt")
    prompt :analyze_key_insights_prompt                     , content: load_file("02-3-analyze-key-insights.txt")
    prompt :analyze_content_themes_prompt                   , content: load_file("02-4-analyze-content-themes.txt")
    prompt :analyze_issues_opportunities_prompt             , content: load_file("02-5-analyze-issues-opportunities.txt")

    

    prompt :extract_talking_points                          , content: load_file("02-1-extract-talking-points.txt")
    prompt :categorize_talking_points                       , content: load_file("02-1-categorize-talking-points.txt")
    
    prompt :refine_talking_points                           , content: load_file("02-2-refine-talking-points.txt")
    prompt :identify_hidden_gems                            , content: load_file("02-3-identify-hidden-gems.txt")
    prompt :suggest_focal_points                            , content: load_file("03-1-suggest-focal-points.txt")
    prompt :define_focal_points                             , content: load_file("03-2-define-focal-points.txt")
    prompt :generate_guest_questions                        , content: load_file("03-3-generate-guest-questions.txt")
    prompt :list_direct_mentions                            , content: load_file("03-4-list-direct-mentions.txt")
    prompt :create_podcast_brief                            , content: load_file("03-5-create-podcast-brief.txt")
    prompt :validate_script                                 , content: load_file("04-1-validate-script.txt")
    prompt :identify_gaps                                   , content: load_file("04-2-identify-gaps.txt")
    prompt :provide_feedback                                , content: load_file("04-3-provide-feedback.txt")
  end

      # input :transcript_original
    # input :transcript_part
    # input :transcript_processed1
    # input :transcript_processed2
    # input :transcript_processed3
    # input :transcript

  attributes do

    # Configuration
    attribute :brand_details, type: :string
    attribute :style_guidelines, type: :string
    attribute :brand_cta, type: :string
    attribute :content_cta, type: :string
    
    # Transcript Processing
    attribute :transcript_original, type: :string
    attribute :transcript_part, type: :string
    attribute :transcript_processed1, type: :string
    attribute :transcript_processed2, type: :string
    attribute :transcript_processed3, type: :string
    attribute :transcript, type: :string
    attribute :transcript_summary, type: :string
    attribute :transcript_abridgement, type: :string
    attribute :transcript_abridgement_descrepencies, type: :array
    attribute :transcript_intro, type: :string
    attribute :transcript_outro, type: :string

    # Analyze Transcript
    attribute :all_talking_points, type: :string
    attribute :talking_point_refinement_instructions
    attribute :refined_talking_points, type: :array
    attribute :hidden_gems, type: :array
    attribute :suggested_focal_points, type: :array
    attribute :main_focal_point, type: :string
    attribute :secondary_focal_points, type: :array
    attribute :guest_questions, type: :array
    attribute :direct_mentions, type: :array
    attribute :podcast_brief, type: :string
    attribute :podcast_script, type: :string
    attribute :validation_results, type: :string
    attribute :content_gaps, type: :array
    attribute :revision_feedback, type: :string
  end

  section 'Transcript Processing' do
    description "Prepare the YouTube live stream transcript for analysis."

    step 'Configure' do
      description "Set brand, style, and general CTAs."
      input :project_code
      input :transcript
      input :brand_details
      input :style_guidelines
      input :brand_cta
      input :content_cta
    end

    step 'Transcript Processor' do
      description "Take the next transcript part and process a final transcript document"
      input :transcript_original
      input :transcript_part
      input :transcript_processed1
      input :transcript_processed2
      input :transcript_processed3
      input :transcript
      prompt :transcript_processor_prompt
      output :transcript
    end

    step 'Script Summary' do
      input :transcript
      input :transcript_summary
      prompt :transcript_summary_prompt
      output :transcript_summary
    end

    step 'Script Abridgement' do
      input :transcript
      input :transcript_abridgement
      prompt :transcript_abridgement_prompt
      output :transcript_abridgement
    end

    step 'Abridge QA' do
      input :transcript
      input :transcript_abridgement
      input :transcript_abridgement_descrepencies
      prompt :transcript_abridgement_descrepencies_prompt
      output :transcript_abridgement_descrepencies
    end

    step 'Get Intro' do
      input :transcript
      input :transcript_intro
      prompt :transcript_intro_prompt
      output :transcript_intro
    end

    step 'Get Outro' do
      input :transcript
      input :transcript_outro
      prompt :transcript_outro_prompt
      output :transcript_outro
    end

    # NOTE: This can be in the post transcript processing
    # It's good, but if this is going to be a general tool
    # Then it needs input as to what to look for for both 
    # general and content related CTAs
    # step 'Find Video CTA' do
    #   input :transcript
    #   prompt :find_video_cta_prompt
    #   output :video_references
    #   output :future_video_cta, type: :string
    #   output :past_video_cta, type: :string
    # end
  end

  # This could be a separate workflow is it can be used in outher
  # content creation workflows.
  section 'Transcript Analysis' do
    description "Analyze the YouTube live stream transcript for key insights."

    # Sure! Here's the updated structure with Content Themes and Structure moved to position 2, and Audience Engagement and Interaction moved to position 3:

    # Key Insights and Key Moments
    
    # Key statistics or data points
    # Emotional moments or impactful statements
    # Actionable advice or tips
    # Important conclusions or final thoughts
    # Content Themes and Structure
    
    # Key themes or overarching topics
    # Storytelling moments with specific examples or anecdotes
    # Mentions of trending or hot topics in the industry
    # Mentions of future directions or goals
    # Unique selling points (USPs)
    # Catchy phrases
    # Audience Engagement and Interaction
    
    # Questions posed to the audience
    # Phrases that could trigger a challenge or community action
    # Callouts to specific audience members or groups
    # References to audience demographics or interests
    # Issues and Opportunities
    
    # Issues raised that need further exploration
    # References to challenges faced during the live stream
    # Possible controversies or points of debate
    # Content Context and Supplementary Information
    
    # Quotes from the speaker or guests
    # References to upcoming events or dates
    # Visual or audio cues mentioned in the stream
    # Mentions of collaborations or joint ventures
    # Search terms
    # Personal and Authentic Elements
    
    # Personal stories or experiences shared by the speakers
    # Emotional Engagement (New Category)
    
    # Emotional triggers or tone
    # Overall tone/style of the content
    

    step 'Engagement Triggers' do
      description "Identify engagement triggers."
      input :transcript
      input :analysis_general_trigger
      input :analysis_brand_trigger
      input :analysis_content_trigger
      prompt :analyze_engagement_triggers_prompt
      output :analysis_general_trigger
      output :analysis_brand_trigger
      output :analysis_content_trigger
    end

    step 'Key Insights/Moments' do
      description "Identify key insights and moments."
      input :transcript
      input :analysis_key_insights
      prompt :analyze_key_insights_prompt
      output :analysis_key_insights
    end

    step 'Audience Engagement' do
      description "Analyze audience engagement."
      input :transcript
      input :analysis_audience_engagement
      prompt :analyze_audience_engagement_prompt
      output :analysis_audience_engagement
    end

    step 'Content Themes' do
      description "Identify key content themes."
      input :transcript
      input :analysis_content_themes
      prompt :analyze_content_themes_prompt
      output :analysis_content_themes
    end

    step 'Issues & Opportunities' do
      description "Highlight issues and opportunities."
      input :transcript
      input :analysis_issues_opportunities
      prompt :analyze_issues_opportunities_prompt
      output :analysis_issues_opportunities
    end

    step 'Personal & Authentic Elements' do
      description "Identify personal and authentic elements."
      input :transcript
      input :analysis_personal_authentic
      prompt :analyze_personal_authentic_prompt
      output :analysis_personal_authentic
    end
      

    # step 'Extract Talking Points' do
    #   description "Identify all relevant discussion points."
    #   input :transcript
    #   prompt :extract_talking_points
    #   output :all_talking_points
    # end

    # step 'Categorize Talking Points' do
    #   description "Sort talking points into categories (general, brand, content)."
    #   input :all_talking_points
    #   prompt :categorize_talking_points
    #   output :categorized
    # end

    # step 'Refine Talking Points' do
    #   description "Refine and prioritize key topics."
    #   input :all_talking_points
    #   input :talking_point_refinement_instructions
    #   input :content_cta
    #   prompt :refine_talking_points
    #   output :refined_talking_points
    # end

    # step 'Identify Hidden Gems' do
    #   description "Highlight unique or unexpected insights."
    #   input :transcript
    #   prompt :identify_hidden_gems
    #   output :hidden_gems
    # end
  end

  section 'Define & Generate Podcast Brief' do
    description "Structure the podcast brief from refined content."

    step 'Suggest Focal Points' do
      description "Propose main themes for the podcast."
      input :refined_talking_points
      input :hidden_gems
      prompt :suggest_focal_points
      output :suggested_focal_points
    end

    step 'Define Focal Points' do
      description "Select main and secondary focal points."
      input :suggested_focal_points
      prompt :define_focal_points
      output :main_focal_point
      output :secondary_focal_points
    end

    step 'Generate Guest Questions' do
      description "Create questions for podcast discussion."
      input :main_focal_point
      input :secondary_focal_points
      prompt :generate_guest_questions
      output :guest_questions
    end

    step 'List Direct Mentions' do
      description "Identify and list specific references."
      input :transcript_text
      prompt :list_direct_mentions
      output :direct_mentions
    end

    step 'Create Podcast Brief' do
      description "Compile structured brief for podcast."
      input :main_focal_point
      input :secondary_focal_points
      input :guest_questions
      input :direct_mentions
      prompt :create_podcast_brief
      output :podcast_brief
    end
  end

  section 'Validate & Refine' do
    description "Ensure quality and accuracy of podcast script."

    step 'Validate Script' do
      description "Check script against the podcast brief."
      input :podcast_brief
      input :podcast_script
      prompt :validate_script
      output :validation_results
    end

    step 'Identify Gaps' do
      description "Find missing or misaligned content."
      input :validation_results
      prompt :identify_gaps
      output :content_gaps
    end

    step 'Provide Feedback' do
      description "Suggest adjustments for improvement."
      input :content_gaps
      prompt :provide_feedback
      output :revision_feedback
    end
  end
end

file = '/Users/davidcruwys/dev/ad/agent-workflow-builder/gpt-agents/src/content/gpt-workflows/youtube-livestream-podcast-brief.json'
dsl
  .save
  .save_json(file)

puts "Time taken: #{Time.now - start_time} seconds"
