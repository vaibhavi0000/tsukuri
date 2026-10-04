import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Calendar,
  Instagram,
  Youtube,
  DollarSign,
  Share2,
  Video,
  Image,
  ExternalLink,
  Target,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Campaign, ContentPost } from '../../types/index.ts';
import { formatCurrency, formatDate } from '../../lib/utils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface MarketingModuleProps {
  campaigns: Campaign[];
  contentPosts: ContentPost[];
  onAddCampaign: (campaign: Partial<Campaign>) => Promise<void>;
  onAddContentPost: (post: Partial<ContentPost>) => Promise<void>;
}

export const MarketingModule: React.FC<MarketingModuleProps> = ({
  campaigns,
  contentPosts,
  onAddCampaign,
  onAddContentPost,
}) => {
  const { canEdit } = useAuth();
  const [activeTab, setActiveTab] = useState<'ads' | 'calendar'>('ads');
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);

  // New Campaign state
  const [campaignName, setCampaignName] = useState('');
  const [channel, setChannel] = useState('Instagram');
  const [spend, setSpend] = useState(3000);
  const [impressions, setImpressions] = useState(25000);
  const [clicks, setClicks] = useState(900);
  const [ordersGenerated, setOrdersGenerated] = useState(10);
  const [revenueGenerated, setRevenueGenerated] = useState(12000);

  // New Content Post state
  const [postTitle, setPostTitle] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [postType, setPostType] = useState('Reel');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [postStatus, setPostStatus] = useState<'Idea' | 'Drafting' | 'Ready' | 'Published'>('Idea');
  const [caption, setCaption] = useState('');

  // Total Ad Metrics
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenueGenerated, 0);
  const totalOrders = campaigns.reduce((sum, c) => sum + c.ordersGenerated, 0);
  const overallRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0';
  const averageCpo = totalOrders > 0 ? Math.round(totalSpend / totalOrders) : 0;

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddCampaign({
      name: campaignName,
      channel,
      spend: Number(spend),
      impressions: Number(impressions),
      clicks: Number(clicks),
      ordersGenerated: Number(ordersGenerated),
      revenueGenerated: Number(revenueGenerated),
      status: 'active',
    });
    setIsAddCampaignOpen(false);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddContentPost({
      title: postTitle,
      platform,
      postType,
      scheduledDate,
      status: postStatus,
      caption,
    });
    setIsAddPostOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Marketing & Ads Tracker
          </h2>
          <p className="text-xs text-slate-500">
            Track paid customer acquisition, calculate ROAS & Cost Per Order (CPO), and plan social drops.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Subtabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('ads')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold ${
                activeTab === 'ads'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              <Target className="w-3.5 h-3.5" /> Ad Campaigns & ROAS
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Content Calendar ({contentPosts.length})
            </button>
          </div>

          {canEdit && (
            <button
              onClick={() => {
                if (activeTab === 'ads') {
                  setCampaignName('');
                  setSpend(2500);
                  setRevenueGenerated(9000);
                  setOrdersGenerated(8);
                  setIsAddCampaignOpen(true);
                } else {
                  setPostTitle('');
                  setCaption('');
                  setIsAddPostOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'ads' ? 'Add Ad Campaign' : 'Plan Social Post'}
            </button>
          )}
        </div>
      </div>

      {/* Ads & Campaigns View */}
      {activeTab === 'ads' && (
        <div className="space-y-6">
          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Ad Spend</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {formatCurrency(totalSpend)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across Meta & Google</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Ad Attributed Sales</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{totalOrders} direct orders</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Blended ROAS</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {overallRoas}x
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Positive Return</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Cost Per Order (CPO)</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {formatCurrency(averageCpo)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Customer acquisition cost</p>
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Campaign Name</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Spend</th>
                    <th className="py-3 px-4">Clicks & Reach</th>
                    <th className="py-3 px-4">Orders</th>
                    <th className="py-3 px-4">Revenue</th>
                    <th className="py-3 px-4">ROAS</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {campaigns.map((camp) => {
                    const roas = camp.spend > 0 ? (camp.revenueGenerated / camp.spend).toFixed(2) : '0';
                    return (
                      <tr key={camp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {camp.name}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                          {camp.channel}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(camp.spend)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {camp.clicks} clicks &bull; {camp.impressions} impr
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                          {camp.ordersGenerated} orders
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(camp.revenueGenerated)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded ${
                              Number(roas) >= 3
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {roas}x
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              camp.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Social Content Calendar View */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentPosts.map((post) => (
              <div
                key={post.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      {post.platform === 'Instagram' ? (
                        <Instagram className="w-4 h-4" />
                      ) : (
                        <Youtube className="w-4 h-4" />
                      )}
                      <span>{post.platform} &bull; {post.postType}</span>
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        post.status === 'Ready'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : post.status === 'Drafting'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2">
                    {post.title}
                  </h3>

                  {post.caption && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 italic">
                      &ldquo;{post.caption}&rdquo;
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(post.scheduledDate)}
                  </span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Scheduled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Campaign Modal */}
      {isAddCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Add Marketing Campaign</h3>
              <button onClick={() => setIsAddCampaignOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Instagram Reels Promo - Crystal Dragons"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google">Google Search</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Spend (₹) *</label>
                  <input
                    type="number"
                    value={spend}
                    onChange={(e) => setSpend(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Impressions</label>
                  <input
                    type="number"
                    value={impressions}
                    onChange={(e) => setImpressions(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Clicks</label>
                  <input
                    type="number"
                    value={clicks}
                    onChange={(e) => setClicks(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Orders Generated</label>
                  <input
                    type="number"
                    value={ordersGenerated}
                    onChange={(e) => setOrdersGenerated(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Revenue Generated (₹)</label>
                  <input
                    type="number"
                    value={revenueGenerated}
                    onChange={(e) => setRevenueGenerated(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCampaignOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Content Post Modal */}
      {isAddPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Schedule Social Media Post</h3>
              <button onClick={() => setIsAddPostOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Post Title / Concept *</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. 24-Hour Timelapse Dragon Bed Release"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Twitter">Twitter / X</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Post Format</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Reel">Reel / Video</option>
                    <option value="Shorts">YouTube Shorts</option>
                    <option value="Carousel">Photo Carousel</option>
                    <option value="Story">Story Drop</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={postStatus}
                    onChange={(e) => setPostStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Idea">Idea</option>
                    <option value="Drafting">Drafting</option>
                    <option value="Ready">Ready</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Caption & Hashtags</label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Drop a caption with hashtags #3dprinting #makers..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPostOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
