import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Modal, Badge } from 'react-bootstrap';
import { commentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ProductComments = ({ productId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [productId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentsAPI.getProductComments(productId);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please log in to add comments');
      return;
    }
    
    if (!newComment.trim()) {
      setError('Please enter a comment');
      return;
    }
    
    if (newComment.length > 1000) {
      setError('Comment is too long (max 1000 characters)');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      console.log('Submitting main comment:', { comment_text: newComment });
      await commentsAPI.addComment(productId, { 
        comment_text: newComment.trim()
        // Don't include parent_comment_id for main comments
      });
      setNewComment('');
      setSuccess('Comment added successfully!');
      fetchComments();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentCommentId) => {
    if (!user) {
      setError('Please log in to reply to comments');
      return;
    }
    
    if (!replyText.trim()) {
      setError('Please enter a reply');
      return;
    }
    
    if (replyText.length > 1000) {
      setError('Reply is too long (max 1000 characters)');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      console.log('Submitting reply:', { 
        comment_text: replyText, 
        parent_comment_id: parentCommentId 
      });
      await commentsAPI.addComment(productId, { 
        comment_text: replyText.trim(),
        parent_comment_id: parentCommentId
      });
      setReplyText('');
      setReplyingTo(null);
      setSuccess('Reply added successfully!');
      fetchComments();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding reply:', error);
      setError(error.response?.data?.message || 'Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) {
      setError('Please enter comment text');
      return;
    }
    
    if (editText.length > 1000) {
      setError('Comment is too long (max 1000 characters)');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      await commentsAPI.updateComment(commentId, { comment_text: editText.trim() });
      setEditingComment(null);
      setEditText('');
      setSuccess('Comment updated successfully!');
      fetchComments();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating comment:', error);
      setError(error.response?.data?.message || 'Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      await commentsAPI.deleteComment(commentToDelete);
      setShowDeleteModal(false);
      setCommentToDelete(null);
      setSuccess('Comment deleted successfully!');
      fetchComments();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.response?.data?.message || 'Failed to delete comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`border-start ${isReply ? 'ms-4 ps-3' : 'ps-3'} mb-3`}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          <strong>{comment.first_name} {comment.last_name}</strong>
          <small className="text-muted ms-2">
            {formatDate(comment.created_at)}
            {comment.is_edited && <Badge bg="secondary" className="ms-1">edited</Badge>}
          </small>
        </div>
        
        {user && user.id === comment.user_id && (
          <div>
            <Button
              variant="link"
              size="sm"
              className="p-0 me-2"
              onClick={() => {
                setEditingComment(comment.id);
                setEditText(comment.comment_text);
              }}
            >
              Edit
            </Button>
            <Button
              variant="link"
              size="sm"
              className="p-0 text-danger"
              onClick={() => {
                setCommentToDelete(comment.id);
                setShowDeleteModal(true);
              }}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
      
      {editingComment === comment.id ? (
        <Form onSubmit={(e) => { e.preventDefault(); handleEditComment(comment.id); }}>
          <Form.Group className="mb-2">
            <Form.Control
              as="textarea"
              rows={3}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={1000}
            />
            <Form.Text className="text-muted">
              {editText.length}/1000 characters
            </Form.Text>
          </Form.Group>
          <div className="d-flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                setEditingComment(null);
                setEditText('');
              }}
            >
              Cancel
            </Button>
          </div>
        </Form>
      ) : (
        <>
          <p className="mb-2">{comment.comment_text}</p>
          
          {!isReply && user && (
            <Button
              variant="link"
              size="sm"
              className="p-0 text-primary"
              onClick={() => setReplyingTo(comment.id)}
            >
              Reply
            </Button>
          )}
          
          {replyingTo === comment.id && (
            <Form onSubmit={(e) => { e.preventDefault(); handleSubmitReply(comment.id); }} className="mt-2">
              <Form.Group className="mb-2">
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  maxLength={1000}
                />
                <Form.Text className="text-muted">
                  {replyText.length}/1000 characters
                </Form.Text>
              </Form.Group>
              <div className="d-flex gap-2">
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Replying...' : 'Reply'}
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          )}
          
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <Card>
      <Card.Header>
        <h5>Comments ({comments.length})</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
        
        {/* Add new comment form */}
        {user ? (
          <Form onSubmit={handleSubmitComment} className="mb-4">
            <Form.Group className="mb-3">
              <Form.Label>Add a comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Share your thoughts about this product..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={1000}
              />
              <Form.Text className="text-muted">
                {newComment.length}/1000 characters
              </Form.Text>
            </Form.Group>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </Form>
        ) : (
          <Alert variant="info">
            Please <a href="/login">log in</a> to add comments.
          </Alert>
        )}
        
        <hr />
        
        {/* Comments list */}
        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-muted text-center py-3">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          <div>
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </Card.Body>
      
      {/* Delete confirmation modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this comment? This action cannot be undone.
          {/* Note: Deleting a parent comment will also delete all replies */}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteComment} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default ProductComments;