'use client';

import React, { useState } from 'react';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Label } from '@/registry/new-york-v4/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/new-york-v4/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select';
import { Textarea } from '@/registry/new-york-v4/ui/textarea';

import { Send, Settings, User, Users } from 'lucide-react';
import { toast } from 'sonner';

type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'GAME' | 'PAYMENT';
type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

interface NotificationForm {
    type: NotificationType;
    title: string;
    message: string;
    priority: NotificationPriority;
    actionUrl?: string;
    actionText?: string;
    sendTo: 'all' | 'specific';
    userIds?: string;
}

export function AdminNotificationPanel() {
    const [form, setForm] = useState<NotificationForm>({
        type: 'INFO',
        title: '',
        message: '',
        priority: 'MEDIUM',
        sendTo: 'all'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title.trim() || !form.message.trim()) {
            toast.error('Please fill in title and message');

            return;
        }

        setLoading(true);
        try {
            const payload = {
                type: form.type,
                title: form.title.trim(),
                message: form.message.trim(),
                priority: form.priority,
                actionUrl: form.actionUrl?.trim() || undefined,
                actionText: form.actionText?.trim() || undefined,
                sendToAll: form.sendTo === 'all',
                userIds:
                    form.sendTo === 'specific' && form.userIds
                        ? form.userIds
                              .split(',')
                              .map((id) => id.trim())
                              .filter(Boolean)
                        : undefined
            };

            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(`Notification sent to ${result.count || 1} users successfully!`);

                // Reset form
                setForm({
                    type: 'INFO',
                    title: '',
                    message: '',
                    priority: 'MEDIUM',
                    sendTo: 'all'
                });
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to send notification');
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            toast.error('Failed to send notification');
        } finally {
            setLoading(false);
        }
    };

    const notificationTypes = [
        { value: 'INFO', label: 'Info', description: 'General information' },
        { value: 'SUCCESS', label: 'Success', description: 'Positive confirmations' },
        { value: 'WARNING', label: 'Warning', description: 'Things that need attention' },
        { value: 'ERROR', label: 'Error', description: 'Problems or failures' },
        { value: 'GAME', label: 'Game', description: 'Game-related updates' },
        { value: 'PAYMENT', label: 'Payment', description: 'Payment-related updates' }
    ];

    const priorityLevels = [
        { value: 'LOW', label: 'Low', description: 'Nice to know' },
        { value: 'MEDIUM', label: 'Medium', description: 'Important' },
        { value: 'HIGH', label: 'High', description: 'Urgent attention needed' }
    ];

    return (
        <Card className='mx-auto w-full max-w-2xl'>
            <CardHeader>
                <div className='flex items-center gap-2'>
                    <Send className='text-primary h-5 w-5' />
                    <CardTitle>Send Notification</CardTitle>
                </div>
                <CardDescription>
                    Send custom notifications to users. Use this for announcements, maintenance notices, or important
                    updates.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className='space-y-6'>
                    {/* Recipients */}
                    <div className='space-y-3'>
                        <Label className='text-sm font-medium'>Recipients</Label>
                        <RadioGroup
                            value={form.sendTo}
                            onValueChange={(value) =>
                                setForm((prev) => ({ ...prev, sendTo: value as 'all' | 'specific' }))
                            }
                            className='flex gap-6'>
                            <div className='flex items-center space-x-2'>
                                <RadioGroupItem value='all' id='all' />
                                <Label htmlFor='all' className='flex items-center gap-2'>
                                    <Users className='h-4 w-4' />
                                    All Users
                                </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <RadioGroupItem value='specific' id='specific' />
                                <Label htmlFor='specific' className='flex items-center gap-2'>
                                    <User className='h-4 w-4' />
                                    Specific Users
                                </Label>
                            </div>
                        </RadioGroup>

                        {form.sendTo === 'specific' && (
                            <div className='space-y-2'>
                                <Label htmlFor='userIds' className='text-sm'>
                                    User IDs (comma-separated)
                                </Label>
                                <Input
                                    id='userIds'
                                    value={form.userIds || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, userIds: e.target.value }))}
                                    placeholder='user1, user2, user3...'
                                    className='font-mono text-sm'
                                />
                                <p className='text-muted-foreground text-xs'>Enter user IDs separated by commas</p>
                            </div>
                        )}
                    </div>

                    {/* Type and Priority */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='type'>Notification Type</Label>
                            <Select
                                value={form.type}
                                onValueChange={(value) =>
                                    setForm((prev) => ({ ...prev, type: value as NotificationType }))
                                }>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {notificationTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <div>
                                                <div className='font-medium'>{type.label}</div>
                                                <div className='text-muted-foreground text-xs'>{type.description}</div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='priority'>Priority</Label>
                            <Select
                                value={form.priority}
                                onValueChange={(value) =>
                                    setForm((prev) => ({ ...prev, priority: value as NotificationPriority }))
                                }>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorityLevels.map((priority) => (
                                        <SelectItem key={priority.value} value={priority.value}>
                                            <div>
                                                <div className='font-medium'>{priority.label}</div>
                                                <div className='text-muted-foreground text-xs'>
                                                    {priority.description}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Title */}
                    <div className='space-y-2'>
                        <Label htmlFor='title'>Title</Label>
                        <Input
                            id='title'
                            value={form.title}
                            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder='e.g., System Maintenance Notice'
                            maxLength={100}
                        />
                        <p className='text-muted-foreground text-xs'>{form.title.length}/100 characters</p>
                    </div>

                    {/* Message */}
                    <div className='space-y-2'>
                        <Label htmlFor='message'>Message</Label>
                        <Textarea
                            id='message'
                            value={form.message}
                            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                            placeholder='Enter your notification message here...'
                            rows={4}
                            maxLength={500}
                        />
                        <p className='text-muted-foreground text-xs'>{form.message.length}/500 characters</p>
                    </div>

                    {/* Action URL and Text */}
                    <div className='space-y-4'>
                        <div className='flex items-center gap-2'>
                            <Settings className='h-4 w-4' />
                            <Label className='text-sm font-medium'>Optional Action (Link)</Label>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='actionUrl' className='text-sm'>
                                    Action URL
                                </Label>
                                <Input
                                    id='actionUrl'
                                    value={form.actionUrl || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, actionUrl: e.target.value }))}
                                    placeholder='/games or https://example.com'
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='actionText' className='text-sm'>
                                    Action Text
                                </Label>
                                <Input
                                    id='actionText'
                                    value={form.actionText || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, actionText: e.target.value }))}
                                    placeholder='Learn More'
                                />
                            </div>
                        </div>
                        <p className='text-muted-foreground text-xs'>
                            If provided, users will see a clickable action button in the notification
                        </p>
                    </div>

                    {/* Submit */}
                    <Button
                        type='submit'
                        className='w-full'
                        disabled={loading || !form.title.trim() || !form.message.trim()}>
                        {loading ? (
                            <>
                                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className='mr-2 h-4 w-4' />
                                Send Notification
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
